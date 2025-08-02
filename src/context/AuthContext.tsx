'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This effect runs once on mount to check if a user session exists from a cookie.
    const fetchUser = async () => {
      try {
        // This new endpoint returns the logged-in user's data if the token is valid.
        const { data } = await axios.get<User>('/api/users/me'); 
        setUser(data);
      } catch (error) {
        // If the request fails (e.g., 401 Unauthorized), it means no one is logged in.
        console.log('User not authenticated:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null); // Clear user from state
      router.push('/auth/login'); // Redirect to login page
      router.refresh(); // Force a refresh to ensure all server components re-evaluate
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to easily use the auth context in any component.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}