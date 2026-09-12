'use client';

import { useState } from 'react';
import { Mail, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { forgotPasswordAction } from '@/lib/actions/auth';

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    const result = await forgotPasswordAction(email);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(true);
    }
    
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-white">Check your email</h1>
        <p className="text-white/70 text-sm leading-relaxed">
          If an account exists for that email, we&apos;ve sent password reset instructions.
        </p>
        <div className="pt-4">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center gap-2 bg-[#B8F25C] text-[#0A1C16] font-bold uppercase tracking-wide py-3 px-6 rounded-xl hover:bg-[#A0E040] transition-colors"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-white/60 text-sm">
          Enter your email to receive recovery instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/80 uppercase tracking-wide px-1">
            Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-white/40 group-focus-within:text-[#B8F25C] transition-colors" />
            </div>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="block w-full pl-11 pr-4 py-3.5 bg-[#0A1C16]/50 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#B8F25C]/50 focus:border-[#B8F25C] transition-all shadow-inner"
              placeholder="name@business.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-[#B8F25C] text-[#0A1C16] font-bold uppercase tracking-wide py-4 px-4 rounded-2xl mt-6 hover:bg-[#A0E040] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(184,242,92,0.2)] hover:shadow-[0_0_25px_rgba(184,242,92,0.4)] group"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Send Instructions
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-white/60">
        <Link href="/sign-in" className="text-white hover:text-[#B8F25C] font-semibold hover:underline">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
