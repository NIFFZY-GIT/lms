'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios, { AxiosError } from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuthCard } from '@/components/auth/AuthCard';
import { InputWithIcon } from '@/components/ui/InputWithIcon';
import { Mail, Hash, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

const RequestSchema = z.object({ email: z.string().email({ message: 'A valid email is required' }) });
const ResetSchema = z.object({
  code: z.string().min(4, { message: 'Enter the code sent to you' }),
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

  const { register: registerReq, handleSubmit: handleSubmitReq, formState: { errors: reqErrors }, reset: resetReq } = useForm<RequestData>({ resolver: zodResolver(RequestSchema) });
  const { register: registerReset, handleSubmit: handleResetSubmit, formState: { errors: resetErrors }, reset: resetReset } = useForm<ResetData>({ resolver: zodResolver(ResetSchema) });

  const onRequest = async (data: RequestData) => {
    try {
      setStatusMsg(null);
      await axios.post('/api/auth/request-reset', data);
      setEmail(data.email);
      setStep(2);
    } catch (e) {
      const err = e as AxiosError<{ error: string }>;
      setStatusMsg(err.response?.data?.error || 'Failed to request reset');
    }
  };

  const onReset = async (data: ResetData) => {
    try {
      await axios.post('/api/auth/reset-password', { email, ...data });
      setStatusMsg('Password has been reset. You can now sign in.');
      resetReq();
      resetReset();
    } catch (e) {
      const err = e as AxiosError<{ error: string }>;
      setStatusMsg(err.response?.data?.error || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <AuthCard
        title={step === 1 ? 'Reset your password' : 'Enter code and new password'}
        subtitle={step === 1 ? 'We\'ll send a reset code to your email.' : 'Check your email for the 6-digit code.'}
        footerContent={
          <p>
            Remembered your password?{' '}
            <Link href={`/${locale}/auth/login`} className="font-medium text-indigo-600 hover:text-indigo-500">
              Back to sign in
            </Link>
          </p>
        }
      >
        {step === 1 && (
          <form onSubmit={handleSubmitReq(onRequest)} className="space-y-6">
            <InputWithIcon
              icon={(props) => <Mail {...props} />}
              registration={registerReq('email')}
              error={reqErrors.email?.message}
              id="email"
              type="email"
              placeholder="Email Address"
              autoComplete="email"
            />

            {statusMsg && (
              <div className={`flex items-center text-sm p-3 rounded-md ${statusMsg.includes('Failed') ? 'text-red-700 bg-red-100' : 'text-green-700 bg-green-100'}`}>
                {statusMsg.includes('Failed') ? <AlertCircle className="w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                {statusMsg}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Send reset code
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetSubmit(onReset)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <InputWithIcon
                icon={(props) => <Hash {...props} />}
                registration={registerReset('code')}
                error={resetErrors.code?.message}
                id="code"
                type="text"
                placeholder="6-digit code"
                autoComplete="one-time-code"
              />
              <InputWithIcon
                icon={(props) => <KeyRound {...props} />}
                registration={registerReset('newPassword')}
                error={resetErrors.newPassword?.message}
                id="newPassword"
                type="password"
                placeholder="New password"
                autoComplete="new-password"
              />
            </div>

            {statusMsg && (
              <div className={`flex items-center text-sm p-3 rounded-md ${statusMsg.includes('Failed') ? 'text-red-700 bg-red-100' : 'text-green-700 bg-green-100'}`}>
                {statusMsg.includes('Failed') ? <AlertCircle className="w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                {statusMsg}
              </div>
            )}

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => { setStep(1); setStatusMsg(null); }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Change email
              </button>
              <button
                type="submit"
                className="py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset password
              </button>
            </div>
          </form>
        )}
      </AuthCard>
    </div>
  );
}
