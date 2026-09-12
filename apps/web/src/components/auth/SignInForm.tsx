'use client';

import { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { signInAction } from '@/lib/actions/auth';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorParam = searchParams.get('error');
  const nextUrl = searchParams.get('next') || '/app';

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === 'AuthCallbackFailed' ? 'Authentication failed. Please try again.' : null
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = await signInAction({ email, password });

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      // Prioritize the role-based redirect path from the server action, but fallback to nextUrl if needed (e.g. they came from a specific page)
      router.push(result.redirectTo || nextUrl);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-white/60 text-sm">
          Enter your credentials to access your business.
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

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/80 uppercase tracking-wide px-1 flex justify-between">
            <span>Password</span>
            <Link
              href="/forgot-password"
              className="text-[#B8F25C] hover:underline normal-case tracking-normal"
            >
              Forgot?
            </Link>
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-white/40 group-focus-within:text-[#B8F25C] transition-colors" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              autoComplete="current-password"
              className="block w-full pl-11 pr-12 py-3.5 bg-[#0A1C16]/50 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#B8F25C]/50 focus:border-[#B8F25C] transition-all shadow-inner"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
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
              Sign In
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-white/60">
        <p>
          Don&apos;t have an account?{' '}
          <Link href={`/sign-up${nextUrl !== '/app' ? `?next=${nextUrl}` : ''}`} className="text-[#B8F25C] font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
