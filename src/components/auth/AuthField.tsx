'use client';

import { forwardRef } from 'react';
import { AlertCircle, CheckCircle2, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Both auth screens previously carried their own near-identical copy of these
// fields. One definition keeps sign-in and sign-up pixel-consistent.

const baseInput =
  'w-full h-12 rounded-xl border bg-white/[0.06] text-white font-medium outline-none backdrop-blur-sm ' +
  'placeholder:text-slate-500 transition-all duration-200';

const stateClasses = (error?: string, isValid?: boolean) => {
  if (error) return 'border-red-400/60 focus:border-red-400 focus:ring-4 focus:ring-red-500/15 bg-red-500/10';
  if (isValid) return 'border-emerald-400/50 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15';
  return 'border-white/15 hover:border-white/25 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/20 focus:bg-white/10';
};

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 pl-1 text-xs text-red-300">
      <AlertCircle size={12} />
      {message}
    </p>
  );
}

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  error?: string;
  isValid?: boolean;
  endAdornment?: React.ReactNode;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, icon: Icon, error, isValid, endAdornment, id, ...props },
  ref
) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="sr-only">{label}</label>
      <div className="group relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within:text-sky-400">
          <Icon size={18} />
        </span>
        <input
          {...props}
          id={inputId}
          ref={ref}
          placeholder={label}
          aria-invalid={error ? true : undefined}
          className={`${baseInput} pl-11 pr-12 ${stateClasses(error, isValid)}`}
        />
        <span className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
          {isValid && !error && <CheckCircle2 size={18} className="text-emerald-400" />}
          {endAdornment}
        </span>
      </div>
      {error && <FieldError message={error} />}
    </div>
  );
});

interface AuthPhoneFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  isValid?: boolean;
}

/** Sri Lankan phone entry — the +94 prefix is fixed, the user types 9 digits. */
export const AuthPhoneField = forwardRef<HTMLInputElement, AuthPhoneFieldProps>(function AuthPhoneField(
  { error, isValid, id, ...props },
  ref
) {
  const inputId = id ?? props.name ?? 'phone';

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="sr-only">Phone number</label>
      <div className="group relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within:text-sky-400">
          <Phone size={18} />
        </span>
        <span className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 border-r border-white/15 pr-3 font-semibold text-white">
          +94
        </span>
        <input
          {...props}
          id={inputId}
          ref={ref}
          type="tel"
          inputMode="numeric"
          maxLength={9}
          placeholder="7XXXXXXXX"
          aria-invalid={error ? true : undefined}
          className={`${baseInput} pl-[5.5rem] pr-12 ${stateClasses(error, isValid)}`}
        />
        {isValid && !error && (
          <CheckCircle2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
        )}
      </div>
      {error && <FieldError message={error} />}
    </div>
  );
});

/** Card the form sits on. */
export function AuthPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[460px] rounded-3xl border border-white/15 bg-white/[0.07] p-7 shadow-[0_30px_70px_-25px_rgb(2_6_23_/_0.9)] backdrop-blur-xl sm:p-9">
      <div className="mb-7">
        <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

/** Primary submit button, matched to the landing hero CTA. */
export function AuthSubmit({
  pending,
  pendingLabel,
  children,
}: { pending: boolean; pendingLabel: string; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3.5 font-bold text-white shadow-[0_10px_35px_-10px_rgb(37_99_235_/_0.9)] transition-all duration-300 hover:shadow-[0_14px_45px_-8px_rgb(37_99_235_/_1)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
    >
      {!pending && (
        <span
          aria-hidden
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />
      )}
      {pending ? (
        <>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          {pendingLabel}
        </>
      ) : (
        <span className="relative flex items-center gap-2">{children}</span>
      )}
    </button>
  );
}

/** Inline error / notice banner. */
export function AuthAlert({
  tone = 'error',
  children,
  onDismiss,
}: { tone?: 'error' | 'warning'; children: React.ReactNode; onDismiss?: () => void }) {
  const tones = {
    error: 'border-red-400/30 bg-red-500/15 text-red-200',
    warning: 'border-amber-400/30 bg-amber-500/15 text-amber-100',
  };

  return (
    <div className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm backdrop-blur-sm ${tones[tone]}`}>
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0 font-bold opacity-70 hover:opacity-100">
          ×
        </button>
      )}
    </div>
  );
}
