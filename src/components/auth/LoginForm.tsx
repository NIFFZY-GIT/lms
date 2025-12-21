'use client';

import { useMemo, useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios, { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { 
  Mail, Lock, AlertCircle, Phone, Eye, EyeOff, 
  ArrowRight, BookOpen, Sparkles, Shield, GraduationCap
} from 'lucide-react';

// Animated Background Component
const AnimatedBackground = () => {
  // Fixed particle positions to avoid hydration mismatch
  const particles = [
    { x: 5, y: 15, scale: 0.7, yEnd: 85, duration: 12 },
    { x: 12, y: 80, scale: 0.9, yEnd: 10, duration: 15 },
    { x: 20, y: 45, scale: 0.6, yEnd: 65, duration: 18 },
    { x: 28, y: 90, scale: 0.8, yEnd: 20, duration: 14 },
    { x: 35, y: 25, scale: 0.5, yEnd: 75, duration: 16 },
    { x: 42, y: 70, scale: 0.7, yEnd: 30, duration: 13 },
    { x: 50, y: 10, scale: 0.9, yEnd: 90, duration: 17 },
    { x: 58, y: 55, scale: 0.6, yEnd: 45, duration: 11 },
    { x: 65, y: 85, scale: 0.8, yEnd: 15, duration: 19 },
    { x: 72, y: 35, scale: 0.5, yEnd: 60, duration: 12 },
    { x: 78, y: 60, scale: 0.7, yEnd: 40, duration: 15 },
    { x: 85, y: 20, scale: 0.9, yEnd: 80, duration: 14 },
    { x: 92, y: 75, scale: 0.6, yEnd: 25, duration: 16 },
    { x: 8, y: 50, scale: 0.8, yEnd: 50, duration: 18 },
    { x: 18, y: 5, scale: 0.5, yEnd: 95, duration: 13 },
    { x: 32, y: 65, scale: 0.7, yEnd: 35, duration: 17 },
    { x: 48, y: 40, scale: 0.9, yEnd: 60, duration: 11 },
    { x: 62, y: 95, scale: 0.6, yEnd: 5, duration: 19 },
    { x: 75, y: 30, scale: 0.8, yEnd: 70, duration: 12 },
    { x: 88, y: 50, scale: 0.5, yEnd: 50, duration: 15 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />
      
      {/* Animated orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/30 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[45%] h-[45%] bg-indigo-500/25 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }} />
      <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-cyan-500/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }} />
      <div className="absolute top-[10%] right-[20%] w-[25%] h-[25%] bg-purple-500/15 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '6s' }} />
      
      {/* Floating particles - fixed positions */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          initial={{ 
            x: `${p.x}%`, 
            y: `${p.y}%`,
            scale: p.scale
          }}
          animate={{ 
            y: [`${p.y}%`, `${p.yEnd}%`],
            opacity: [0.2, 0.8, 0.2]
          }}
          transition={{ 
            duration: p.duration,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
      
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40" />
    </div>
  );
};

// Custom Input Component
const FloatingInput = ({ label, icon: Icon, error, endAdornment, ...props }: any) => (
  <div className="space-y-1.5">
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200">
        <Icon size={18} />
      </div>
      <input
        {...props}
        className={`w-full h-13 pl-11 pr-12 bg-white/5 backdrop-blur-sm border-2 rounded-xl outline-none transition-all duration-200
          placeholder:text-gray-400 text-white font-medium
          ${error 
            ? 'border-red-400/50 focus:border-red-400 focus:ring-4 focus:ring-red-500/20 bg-red-500/10' 
            : 'border-white/10 hover:border-white/20 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white/10'
          }`}
        placeholder={label}
      />
      {endAdornment && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {endAdornment}
        </div>
      )}
    </div>
    <AnimatePresence>
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-xs text-red-400 flex items-center gap-1.5 pl-1"
        >
          <AlertCircle size={12}/>{error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

// Schemas
const EmailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const PhoneSchema = z.object({
  phone: z.string()
    .min(9, { message: 'Phone must be 9 digits' })
    .max(9, { message: 'Phone must be 9 digits' })
    .regex(/^[0-9]+$/, { message: 'Phone must contain only numbers' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFields = { email?: string; phone?: string; password: string };

interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
}

export function LoginForm() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const callbackUrl = searchParams.get('callbackUrl') ?? searchParams.get('next');

  const localeParam = (params as { locale?: string | string[] } | null)?.locale;
  const locale = typeof localeParam === 'string' ? localeParam : Array.isArray(localeParam) ? (localeParam[0] ?? 'en') : 'en';

  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [formError, setFormError] = useState<string | null>(null);
  const [idleMessage, setIdleMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const resolver = useMemo<Resolver<LoginFields>>(() => {
    const r = mode === 'email' ? zodResolver(EmailSchema) : zodResolver(PhoneSchema);
    return r as unknown as Resolver<LoginFields>;
  }, [mode]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LoginFields>({ resolver });

  const loginMutation = useMutation<UserResponse, AxiosError<{ error: string }>, LoginFields>({
    mutationFn: (credentials) => axios.post('/api/auth/login', credentials).then(res => res.data),
    onSuccess: (data) => {
      login(data);
      const roleDefault = data.role === 'ADMIN'
        ? `/${locale}/dashboard/admin`
        : data.role === 'INSTRUCTOR'
          ? `/${locale}/dashboard/instructor`
          : `/${locale}/dashboard/student/courses`;

      let target = roleDefault;
      if (callbackUrl) {
        const allowed = (
          (data.role === 'ADMIN' && /([a-zA-Z-]+\/)?dashboard\/admin/.test(callbackUrl)) ||
          (data.role === 'INSTRUCTOR' && /([a-zA-Z-]+\/)?dashboard\/instructor/.test(callbackUrl)) ||
          (data.role === 'STUDENT' && /([a-zA-Z-]+\/)?dashboard\/student/.test(callbackUrl))
        );
        if (allowed) target = callbackUrl.startsWith('/') ? callbackUrl : `/${callbackUrl}`;
      }
      router.push(target);
    },
    onError: (error) => {
      setFormError(error.response?.data?.error || 'An unexpected error occurred.');
    },
  });

  const onSubmit = (data: LoginFields) => {
    setFormError(null);
    // Prepend +94 to phone if logging in with phone
    const credentials = mode === 'phone' && data.phone
      ? { ...data, phone: `+94${data.phone}` }
      : data;
    loginMutation.mutate(credentials);
  };

  useEffect(() => {
    try {
      const v = sessionStorage.getItem('idle-logout');
      if (v) {
        setIdleMessage('You were logged out due to inactivity. Please sign in again.');
        sessionStorage.removeItem('idle-logout');
      }
    } catch {}
  }, []);

  const switchMode = (next: 'email' | 'phone') => {
    setMode(next);
    setFormError(null);
    reset();
  };

  const features = [
    { icon: Sparkles, text: "Interactive live classes" },
    { icon: Shield, text: "Secure learning environment" },
    { icon: GraduationCap, text: "Expert instructors" },
  ];

  return (
    <div className="relative flex flex-1 min-h-screen overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Content Container */}
      <div className="relative z-10 flex w-full">
        {/* LEFT: HERO SECTION */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="flex items-center gap-3 text-white group">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-300">
                <BookOpen size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight">Online Thakshilawa</span>
            </Link>
          </motion.div>

          {/* Main Content */}
          <div className="max-w-lg">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl font-bold text-white leading-tight mb-6"
            >
              Welcome back to your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-gradient bg-[length:200%_auto]">
                learning journey
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-300 text-lg mb-8"
            >
              Continue where you left off. Access your courses, track your progress, and achieve your goals.
            </motion.p>

            {/* Features */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-4"
            >
              {features.map((feature, i) => (
                <motion.div 
                  key={i} 
                  className="flex items-center gap-3 text-gray-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                >
                  <div className="p-2 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                    <feature.icon size={18} className="text-blue-400" />
                  </div>
                  <span>{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-3 gap-8 border-t border-white/10 pt-8"
          >
            {[
              { value: '50+', label: 'Courses' },
              { value: '500+', label: 'Students' },
              { value: '20+', label: 'Instructors' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT: FORM SECTION */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12">
          {/* Mobile Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:hidden mb-8 flex flex-col items-center"
          >
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg shadow-blue-500/25 mb-4">
              <BookOpen size={32} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Online Thakshilawa</h1>
          </motion.div>

          {/* Glass Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[420px] bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-black/20"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Sign in</h2>
              <p className="text-gray-400">Welcome back! Please enter your details.</p>
            </div>

            {/* Mode Switcher */}
            <div className="flex p-1.5 bg-white/5 rounded-xl mb-6 border border-white/10">
              {(['email', 'phone'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    mode === m 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {m === 'email' ? 'Email' : 'Phone'}
                </button>
              ))}
            </div>

            {/* Idle Message */}
            <AnimatePresence>
              {idleMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-amber-500/20 border border-amber-500/30 text-amber-200 rounded-xl text-sm flex items-start gap-3 backdrop-blur-sm"
                >
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1">{idleMessage}</div>
                  <button onClick={() => setIdleMessage(null)} className="text-amber-300 hover:text-amber-100 font-medium">×</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {formError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl text-sm flex items-center gap-3 backdrop-blur-sm"
                >
                  <AlertCircle size={18} className="flex-shrink-0" />
                  {formError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {mode === 'email' ? (
                    <FloatingInput
                      label="Email address"
                      icon={Mail}
                      type="email"
                      error={errors.email?.message}
                      autoComplete="email"
                      {...register('email')}
                    />
                  ) : (
                    <div className="space-y-1.5">
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200">
                          <Phone size={18} />
                        </div>
                        <span className="absolute left-11 top-1/2 -translate-y-1/2 text-white font-medium">+94</span>
                        <input
                          type="tel"
                          placeholder="7XXXXXXXX"
                          autoComplete="tel"
                          {...register('phone')}
                          className={`w-full h-13 pl-[4.5rem] pr-4 bg-white/5 backdrop-blur-sm border-2 rounded-xl outline-none transition-all duration-200
                            placeholder:text-gray-400 text-white font-medium
                            ${errors.phone?.message 
                              ? 'border-red-400/50 focus:border-red-400 focus:ring-4 focus:ring-red-500/20 bg-red-500/10' 
                              : 'border-white/10 hover:border-white/20 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:bg-white/10'
                            }`}
                        />
                      </div>
                      <AnimatePresence>
                        {errors.phone?.message && (
                          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="text-xs text-red-400 flex items-center gap-1.5 pl-1">
                            <AlertCircle size={12}/>{errors.phone?.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <FloatingInput
                label="Password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                error={errors.password?.message}
                autoComplete="current-password"
                {...register('password')}
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500 focus:ring-offset-0" 
                  />
                  <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Remember me</span>
                </label>
                <Link 
                  href={`/${locale}/auth/reset`} 
                  className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <motion.button
                type="submit"
                disabled={loginMutation.isPending}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
              >
                {loginMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Register Link */}
            <p className="mt-8 text-center text-gray-400">
              Don't have an account?{' '}
              <Link 
                href={`/${locale}/auth/register`} 
                className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
              >
                Create account
              </Link>
            </p>
          </motion.div>

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center space-y-2"
          >
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} onlinethakshilawa.lk — All rights reserved
            </p>
           
          </motion.div>
        </div>
      </div>
    </div>
  );
}