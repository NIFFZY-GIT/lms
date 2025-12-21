'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios, { AxiosError } from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Hash, KeyRound, AlertCircle, CheckCircle2, BookOpen, ArrowRight, ArrowLeft, Shield } from 'lucide-react';

// Animated Background Component
const AnimatedBackground = () => {
  const particles = [
    { x: 10, y: 25, scale: 0.7, yEnd: 75, duration: 12 },
    { x: 22, y: 70, scale: 0.9, yEnd: 20, duration: 15 },
    { x: 34, y: 45, scale: 0.6, yEnd: 65, duration: 18 },
    { x: 46, y: 80, scale: 0.8, yEnd: 30, duration: 14 },
    { x: 58, y: 35, scale: 0.5, yEnd: 75, duration: 16 },
    { x: 70, y: 60, scale: 0.7, yEnd: 40, duration: 13 },
    { x: 82, y: 20, scale: 0.9, yEnd: 80, duration: 17 },
    { x: 94, y: 55, scale: 0.6, yEnd: 45, duration: 11 },
    { x: 16, y: 85, scale: 0.8, yEnd: 15, duration: 19 },
    { x: 28, y: 50, scale: 0.5, yEnd: 50, duration: 12 },
    { x: 40, y: 15, scale: 0.7, yEnd: 85, duration: 15 },
    { x: 52, y: 65, scale: 0.9, yEnd: 35, duration: 14 },
    { x: 64, y: 40, scale: 0.6, yEnd: 60, duration: 16 },
    { x: 76, y: 95, scale: 0.8, yEnd: 5, duration: 18 },
    { x: 88, y: 30, scale: 0.5, yEnd: 70, duration: 13 },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/30 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[45%] h-[45%] bg-indigo-500/25 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }} />
      <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-cyan-500/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }} />
      <div className="absolute top-[10%] right-[20%] w-[25%] h-[25%] bg-purple-500/15 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '6s' }} />
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          initial={{ x: `${p.x}%`, y: `${p.y}%`, scale: p.scale }}
          animate={{ y: [`${p.y}%`, `${p.yEnd}%`], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear" }}
        />
      ))}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40" />
    </div>
  );
};

// Custom Input Component
const FloatingInput = ({ label, icon: Icon, error, ...props }: any) => (
  <div className="space-y-1.5">
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200">
        <Icon size={18} />
      </div>
      <input
        {...props}
        className={`w-full h-13 pl-11 pr-4 bg-white/5 backdrop-blur-sm border-2 rounded-xl outline-none transition-all duration-200
          placeholder:text-gray-400 text-white font-medium
          ${error 
            ? 'border-red-400/50 focus:border-red-400 focus:ring-4 focus:ring-red-500/20 bg-red-500/10' 
            : 'border-white/10 hover:border-white/20 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white/10'
          }`}
        placeholder={label}
      />
    </div>
    <AnimatePresence>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          className="text-xs text-red-400 flex items-center gap-1.5 pl-1">
          <AlertCircle size={12}/>{error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const RequestSchema = z.object({ email: z.string().email({ message: 'Please enter a valid email' }) });
const ResetSchema = z.object({
  code: z.string().min(4, { message: 'Enter the code sent to your email' }),
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type RequestData = z.infer<typeof RequestSchema>;
type ResetData = z.infer<typeof ResetSchema>;

export default function ResetPasswordPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const { register: registerReq, handleSubmit: handleSubmitReq, formState: { errors: reqErrors }, reset: resetReq } = useForm<RequestData>({ resolver: zodResolver(RequestSchema) });
  const { register: registerReset, handleSubmit: handleResetSubmit, formState: { errors: resetErrors }, reset: resetReset } = useForm<ResetData>({ resolver: zodResolver(ResetSchema) });

  const onRequest = async (data: RequestData) => {
    try {
      setStatusMsg(null);
      setDevCode(null);
      setIsLoading(true);
      const response = await axios.post('/api/auth/request-reset', data);
      setEmail(data.email);
      if (response.data.devCode) setDevCode(response.data.devCode);
      setStep(2);
    } catch (e) {
      const err = e as AxiosError<{ error: string }>;
      setStatusMsg(err.response?.data?.error || 'Failed to request reset');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const onReset = async (data: ResetData) => {
    try {
      setIsLoading(true);
      await axios.post('/api/auth/reset-password', { email, ...data });
      setStatusMsg('Password has been reset successfully!');
      setIsSuccess(true);
      resetReq();
      resetReset();
    } catch (e) {
      const err = e as AxiosError<{ error: string }>;
      setStatusMsg(err.response?.data?.error || 'Failed to reset password');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-1 min-h-screen overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 flex w-full">
        {/* LEFT: HERO */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link href="/" className="flex items-center gap-3 text-white group">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-300">
                <BookOpen size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight">Online Thakshilawa</span>
            </Link>
          </motion.div>

          <div className="max-w-lg">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-6">
              <Shield size={16} className="text-blue-400" />
              <span className="text-sm text-gray-300">Secure password reset</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl font-bold text-white leading-tight mb-6">
              Reset your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-gradient bg-[length:200%_auto]">
                password
              </span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="text-gray-300 text-lg">
              Don't worry, it happens to everyone. We'll send you a secure code to reset your password.
            </motion.p>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="border-t border-white/10 pt-8">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-3 ${step >= 1 ? 'text-white' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-blue-600' : 'bg-white/10'}`}>1</div>
                <span className="text-sm">Enter email</span>
              </div>
              <div className={`w-8 h-px ${step >= 2 ? 'bg-blue-600' : 'bg-white/20'}`} />
              <div className={`flex items-center gap-3 ${step >= 2 ? 'text-white' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-blue-600' : 'bg-white/10'}`}>2</div>
                <span className="text-sm">Reset password</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT: FORM */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="lg:hidden mb-8 flex flex-col items-center">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg shadow-blue-500/25 mb-4">
              <BookOpen size={32} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Online Thakshilawa</h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}
            className="w-full max-w-[420px] bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-black/20">
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl mb-4 border border-blue-500/30">
                {step === 1 ? <Mail className="text-blue-400" size={24} /> : <KeyRound className="text-blue-400" size={24} />}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{step === 1 ? 'Forgot password?' : 'Create new password'}</h2>
              <p className="text-gray-400">{step === 1 ? "No worries, we'll send you reset instructions." : `Enter the code sent to ${email}`}</p>
            </div>

            {/* Success */}
            <AnimatePresence>
              {statusMsg && isSuccess && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 rounded-xl text-sm flex items-center gap-3 backdrop-blur-sm">
                  <CheckCircle2 size={18} className="flex-shrink-0" />
                  <div>
                    <p className="font-medium">{statusMsg}</p>
                    <Link href={`/${locale}/auth/login`} className="text-emerald-300 font-semibold hover:underline">Back to sign in →</Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {statusMsg && !isSuccess && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl text-sm flex items-center gap-3 backdrop-blur-sm">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  {statusMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dev Code */}
            <AnimatePresence>
              {devCode && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-amber-500/20 border border-amber-500/30 text-amber-200 rounded-xl text-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="flex-shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-semibold">DEV MODE: Email delivery failed</p>
                      <p className="mt-1">Your reset code is: <strong className="font-mono text-lg bg-amber-500/30 px-2 py-0.5 rounded">{devCode}</strong></p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 1 */}
            <AnimatePresence mode="wait">
              {step === 1 && !isSuccess && (
                <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSubmitReq(onRequest)} className="space-y-5">
                  <FloatingInput label="Email address" icon={Mail} type="email" error={reqErrors.email?.message} autoComplete="email" {...registerReq('email')} />
                  <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30">
                    {isLoading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : <>Send reset code<ArrowRight size={18} /></>}
                  </motion.button>
                </motion.form>
              )}

              {/* Step 2 */}
              {step === 2 && !isSuccess && (
                <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleResetSubmit(onReset)} className="space-y-5">
                  <FloatingInput label="Verification code" icon={Hash} type="text" error={resetErrors.code?.message} autoComplete="one-time-code" {...registerReset('code')} />
                  <FloatingInput label="New password" icon={KeyRound} type="password" error={resetErrors.newPassword?.message} autoComplete="new-password" {...registerReset('newPassword')} />
                  <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30">
                    {isLoading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Resetting...</> : <>Reset password<ArrowRight size={18} /></>}
                  </motion.button>
                  <button type="button" onClick={() => { setStep(1); setStatusMsg(null); setDevCode(null); }}
                    className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white font-medium py-2 transition-colors">
                    <ArrowLeft size={16} />Use a different email
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="mt-8 text-center text-gray-400">
              Remember your password?{' '}
              <Link href={`/${locale}/auth/login`} className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">Back to sign in</Link>
            </p>
          </motion.div>

          {/* Footer */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 text-center space-y-2">
            <p className="text-gray-500 text-sm">© {new Date().getFullYear()} onlinethakshilawa.lk — All rights reserved</p>
           
          </motion.div>
        </div>
      </div>
    </div>
  );
}
