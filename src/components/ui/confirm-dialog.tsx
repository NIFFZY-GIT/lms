"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      setPending({ resolve, ...options });
    });
  }, []);

  const handleClose = (result: boolean) => {
    if (pending) {
      pending.resolve(result);
      setPending(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => handleClose(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-xl shadow-lg p-6 animate-in fade-in zoom-in duration-200">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" onClick={() => handleClose(false)} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
            {pending.title && <h2 className="text-lg font-semibold mb-2 pr-6">{pending.title}</h2>}
            {pending.description && <p className="text-sm text-gray-600 mb-6 leading-relaxed whitespace-pre-line">{pending.description}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => handleClose(false)} className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition">{pending.cancelText || 'Cancel'}</button>
              <button onClick={() => handleClose(true)} className={`px-4 py-2 rounded-md text-sm font-semibold text-white transition shadow ${pending.destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{pending.confirmText || 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
