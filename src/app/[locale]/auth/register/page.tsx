'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios, { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, Mail, Lock, MapPin, Eye, EyeOff, 
  AlertCircle, ArrowRight, BookOpen, Sparkles, 
  Shield, GraduationCap, CheckCircle2 
} from 'lucide-react';

// Animated Background Component
const AnimatedBackground = () => {
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    scale: 0.5 + Math.random() * 0.5,
    yEnd: Math.random() * 100,
    duration: 10 + Math.random() * 10,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          initial={{ x: `${p.x}%`, y: `${p.y}%`, scale: p.scale }}
          animate={{ y: [`${p.y}%`, `${p.yEnd}%`], opacity: [0, 1, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

// Reusable Input Component
const FormField = ({ label, icon: Icon, error, isValid, endAdornment, ...props }: any) => (
  <div className="space-y-1.5 w-full">
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-200">
        <Icon size={18} />
      </div>
      <input
        {...props}
        className={`w-full h-12 pl-11 pr-12 bg-white/5 backdrop-blur-md border-2 rounded-xl outline-none transition-all duration-200
          placeholder:text-gray-500 text-white font-medium
          ${error 
            ? 'border-red-500/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-500/5' 
            : isValid 
              ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
              : 'border-white/10 hover:border-white/20 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white/10'
          }`}
        placeholder={label}
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {isValid && !error && <CheckCircle2 size={18} className="text-emerald-500" />}
        {endAdornment}
      </div>
    </div>
    <AnimatePresence mode="wait">
      {error && (
        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className="text-xs text-red-400 flex items-center gap-1.5 pl-1">
          <AlertCircle size={12}/>{error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const RegisterSchema = z.object({
  name: z.string().min(2, { message: 'Full name is required' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  address: z.string().min(10, { message: 'Please enter your full street address' }),
  phone: z.string()
    .min(9, { message: 'Enter the 9 digits after +94' })
    .max(9, { message: 'Enter the 9 digits after +94' })
    .regex(/^[0-9]+$/, { message: 'Phone must contain only numbers' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type RegisterData = z.infer<typeof RegisterSchema>;

function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'];

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, dirtyFields } } = useForm<RegisterData>({
    resolver: zodResolver(RegisterSchema),
    mode: 'onChange'
  });

  const pw = watch('password') || '';
  const pwStrength = useMemo(() => getStrength(pw), [pw]);

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => axios.post('/api/auth/register', data).then(res => res.data),
    onSuccess: () => router.push(`/${locale}/auth/login?registered=true`),
    onError: (error: AxiosError<{ message?: string; error?: string }>) => {
      setServerError(error.response?.data?.message || 'Email already exists or server error.');
    },
  });

  const onSubmit = (data: RegisterData) => {
    setServerError(null);
    registerMutation.mutate({ ...data, phone: `+94${data.phone}` });
  };

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row">
      <AnimatedBackground />

      {/* Hero Section */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link href="/" className="flex items-center gap-3 text-white">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <BookOpen size={28} />
            </div>
            <span className="text-2xl font-bold">Online Thakshilawa</span>
          </Link>
        </motion.div>

        <div className="space-y-6">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl font-bold text-white leading-tight">
            Start Your <br />
            <span className="text-blue-400">Future Today.</span>
          </motion.h1>
          <div className="space-y-4">
            {[{ i: GraduationCap, t: "Expert Instructors" }, { i: Shield, t: "Verified Certificates" }, { i: Sparkles, t: "Premium Content" }].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-300">
                <f.i className="text-blue-400" size={20} />
                <span className="font-medium">{f.t}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-500 text-sm">© {new Date().getFullYear()} onlinethakshilawa.lk</p>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[550px] bg-slate-900/40 backdrop-blur-3xl p-8 sm:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl"
        >
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-gray-400 font-medium">Please fill in your details to get started.</p>
          </div>

          <AnimatePresence>
            {serverError && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-3">
                <AlertCircle size={18} /> {serverError}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <FormField 
              label="Full Name" 
              icon={User} 
              isValid={dirtyFields.name && !errors.name}
              error={errors.name?.message} 
              {...register('name')} 
            />

            {/* Email - Full Width */}
            <FormField 
              label="Email Address" 
              icon={Mail} 
              type="email"
              isValid={dirtyFields.email && !errors.email}
              error={errors.email?.message} 
              {...register('email')} 
            />

            {/* Phone - Compact */}
            <div className="space-y-1.5">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Phone size={18} />
                </div>
                <span className="absolute left-11 top-1/2 -translate-y-1/2 text-white font-bold border-r border-white/10 pr-3">+94</span>
                <input
                  type="tel"
                  placeholder="7XXXXXXXX"
                  {...register('phone')}
                  className={`w-full h-12 pl-24 pr-4 bg-white/5 border-2 rounded-xl outline-none transition-all
                    placeholder:text-gray-500 text-white font-medium
                    ${errors.phone ? 'border-red-500/50' : dirtyFields.phone ? 'border-emerald-500/50' : 'border-white/10 focus:border-blue-500'}`}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-400 pl-1">{errors.phone.message}</p>}
            </div>

            {/* Address - Full Width & Lengthier */}
            <FormField 
              label="Full Home Address" 
              icon={MapPin} 
              isValid={dirtyFields.address && !errors.address}
              error={errors.address?.message} 
              {...register('address')} 
            />

            {/* Password */}
            <div className="space-y-3">
              <FormField
                label="Create Password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                error={errors.password?.message}
                {...register('password')}
                endAdornment={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-white">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              {pw.length > 0 && (
                <div className="px-1">
                  <div className="flex gap-1.5 mb-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < pwStrength ? strengthColor[pwStrength - 1] : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Security: {strengthLabel[pwStrength - 1] || 'Too Short'}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 active:scale-[0.98]"
            >
              {registerMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Link href={`/${locale}/auth/login`} className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}