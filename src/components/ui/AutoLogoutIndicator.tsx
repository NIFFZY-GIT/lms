'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

export function AutoLogoutIndicator() {
  const { isAutoLogoutPaused } = useAuth();
  if (!isAutoLogoutPaused) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-md shadow-sm text-sm">
        Auto-logout paused while media is playing
      </div>
    </div>
  );
}
