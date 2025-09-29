'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useRef, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
}

// --- 1. UPDATE THE TYPE DEFINITION ---
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void; // Add the login function signature
  logout: () => Promise<void>;
  isAutoLogoutPaused?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get<User>('/api/users/me'); 
        setUser(data);
  } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  

  // --- 2. DEFINE THE LOGIN FUNCTION ---
  // This function simply updates the local state with the user data from the login API.
  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
      // Get current locale from pathname for redirect
      const currentPath = window.location.pathname;
      const localeMatch = currentPath.match(/^\/([a-zA-Z-]+)\//); 
      const locale = localeMatch ? localeMatch[1] : 'en';
      router.push(`/${locale}/auth/login`);
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [router]);

  // Inactivity auto-logout: 5 minutes
  const INACTIVITY_MS = 5 * 60 * 1000;
  const timerRef = useRef<number | null>(null);

  const clearInactivityTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const playingCountRef = useRef(0);
  const [isAutoLogoutPaused, setIsAutoLogoutPaused] = useState(false);

  const startInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    timerRef.current = window.setTimeout(async () => {
      try {
        try {
          sessionStorage.setItem('idle-logout', '1');
        } catch {}
        await logout();
      } catch {
        // ignore
      }
    }, INACTIVITY_MS) as unknown as number;
  }, [logout, INACTIVITY_MS, clearInactivityTimer]);

  const activityHandler = useCallback(() => {
    // reset the timer on user activity
    if (user) startInactivityTimer();
  }, [user, startInactivityTimer]);

  useEffect(() => {
    // add listeners when a user is present
    if (!user) {
      clearInactivityTimer();
      return;
    }

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    for (const ev of events) {
      window.addEventListener(ev, activityHandler, { passive: true });
    }

    // start timer immediately when user becomes active
    startInactivityTimer();

    return () => {
      clearInactivityTimer();
      for (const ev of events) {
        window.removeEventListener(ev, activityHandler as EventListener);
      }
    };
  }, [user, activityHandler, startInactivityTimer, clearInactivityTimer]);

  // Pause auto-logout while any media element is playing (video/audio)
  useEffect(() => {
    if (!user) return;

    const onPlay = () => {
      playingCountRef.current += 1;
      setIsAutoLogoutPaused(true);
      clearInactivityTimer();
    };
    const onStop = () => {
      playingCountRef.current = Math.max(0, playingCountRef.current - 1);
      if (playingCountRef.current === 0) {
        setIsAutoLogoutPaused(false);
        if (user) startInactivityTimer();
      }
    };

    // capture phase so events from nested media elements bubble up
    document.addEventListener('play', onPlay, true);
    document.addEventListener('pause', onStop, true);
    document.addEventListener('ended', onStop, true);

    return () => {
      document.removeEventListener('play', onPlay, true);
      document.removeEventListener('pause', onStop, true);
      document.removeEventListener('ended', onStop, true);
    };
  }, [user, startInactivityTimer, clearInactivityTimer]);

  // --- 3. PASS THE LOGIN FUNCTION TO THE PROVIDER'S VALUE ---
  return (
  <AuthContext.Provider value={{ user, isLoading, login, logout, isAutoLogoutPaused }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}