"use client";
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number; // ms
}

interface ToastContextValue {
  push: (t: Omit<Toast,'id'>) => void;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider />');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const queueRef = useRef<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const push = useCallback((t: Omit<Toast,'id'>) => {
    const toast: Toast = { id: crypto.randomUUID(), duration: 4000, variant: 'info', ...t };
    queueRef.current.push(toast);
    setToasts(prev => [...prev, toast]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map(t => {
      if (!t.duration) return undefined;
      return setTimeout(() => remove(t.id), t.duration);
    });
    return () => { timers.forEach(tm => tm && clearTimeout(tm)); };
  }, [toasts, remove]);

  const value = { push, remove };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

function variantStyles(v?: ToastVariant) {
  switch (v) {
    case 'success': return 'border-emerald-500 bg-emerald-50 text-emerald-800';
    case 'error': return 'border-red-500 bg-red-50 text-red-800';
    case 'warning': return 'border-amber-500 bg-amber-50 text-amber-800';
  default: return 'border-blue-500 bg-white text-gray-800';
  }
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string)=>void }) {
  return (
    <div className="fixed z-[100] top-4 right-4 flex flex-col gap-3 w-[340px] max-w-[90vw]">
      {toasts.map(t => (
        <div key={t.id} className={`group shadow-sm border rounded-lg px-4 py-3 relative overflow-hidden backdrop-blur bg-opacity-90 animate-slide-in flex items-start gap-3 ${variantStyles(t.variant)}`}>
          <div className="flex-1 min-w-0">
            {t.title && <p className="font-semibold text-sm leading-tight mb-0.5">{t.title}</p>}
            <p className="text-sm leading-snug break-words">{t.message}</p>
          </div>
          <button onClick={() => onDismiss(t.id)} className="opacity-70 hover:opacity-100 transition p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <style jsx global>{`
        @keyframes slide-in { from { transform: translateX(12px); opacity: 0 } to { transform: translateX(0); opacity:1 } }
        .animate-slide-in { animation: slide-in .25s ease-out; }
      `}</style>
    </div>
  );
}

// Helper shortcuts
export const toast = {
  success: (message: string, title?: string) => window.dispatchEvent(new CustomEvent('app-toast', { detail: { variant: 'success', message, title } })),
  error: (message: string, title?: string) => window.dispatchEvent(new CustomEvent('app-toast', { detail: { variant: 'error', message, title } })),
  info: (message: string, title?: string) => window.dispatchEvent(new CustomEvent('app-toast', { detail: { variant: 'info', message, title } })),
  warning: (message: string, title?: string) => window.dispatchEvent(new CustomEvent('app-toast', { detail: { variant: 'warning', message, title } })),
};

// Bridge: allow imperative toast.* usage without importing hook
declare global {
  interface Window { __TOAST_PUSH__?: (t: Omit<Toast,'id'>) => void }
}

if (typeof window !== 'undefined') {
  window.addEventListener('app-toast', (e: Event) => {
    const detail = (e as CustomEvent).detail as Omit<Toast,'id'>;
    window.__TOAST_PUSH__?.(detail);
  });
}

export function GlobalToastBridge() {
  const { push } = useToast();
  useEffect(() => { window.__TOAST_PUSH__ = push; return () => { delete window.__TOAST_PUSH__; }; }, [push]);
  return null;
}
