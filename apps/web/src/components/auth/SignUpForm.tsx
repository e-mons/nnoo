'use client';

import { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, User } from 'lucide-react';
import Link from 'next/link';
import { signUpAction } from '@/lib/actions/auth';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/app';
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    const result = await signUpAction({ firstName, lastName, email, password }, nextUrl);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      if (result.requiresEmailVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        router.push(nextUrl || '/onboarding');
      }
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-white/60 text-sm">
          Start building a stronger business record today.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wide px-1">
              First Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-white/40 group-focus-within:text-[#B8F25C] transition-colors" />
              </div>
              <input
                type="text"
                name="firstName"
                required
                autoComplete="given-name"
                className="block w-full pl-11 pr-4 py-3.5 bg-[#0A1C16]/50 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#B8F25C]/50 focus:border-[#B8F25C] transition-all shadow-inner"
                placeholder="Jane"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wide px-1">
              Last Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-white/40 group-focus-within:text-[#B8F25C] transition-colors" />
              </div>
              <input
                type="text"
                name="lastName"
                required
                autoComplete="family-name"
                className="block w-full pl-11 pr-4 py-3.5 bg-[#0A1C16]/50 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#B8F25C]/50 focus:border-[#B8F25C] transition-all shadow-inner"
                placeholder="Doe"
              />
            </div>
          </div>
        </div>

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
          <label className="text-xs font-semibold text-white/80 uppercase tracking-wide px-1">
            Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-white/40 group-focus-within:text-[#B8F25C] transition-colors" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="block w-full pl-11 pr-12 py-3.5 bg-[#0A1C16]/50 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#B8F25C]/50 focus:border-[#B8F25C] transition-all shadow-inner"
              placeholder="Min. 8 characters"
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

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/80 uppercase tracking-wide px-1">
            Confirm Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-white/40 group-focus-within:text-[#B8F25C] transition-colors" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              required
              autoComplete="new-password"
              minLength={8}
              className="block w-full pl-11 pr-12 py-3.5 bg-[#0A1C16]/50 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#B8F25C]/50 focus:border-[#B8F25C] transition-all shadow-inner"
              placeholder="Confirm password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-start gap-3 text-sm text-white/70">
            <input 
              type="checkbox" 
              name="terms" 
              required
              className="mt-1 bg-[#0A1C16]/50 border-white/20 text-[#B8F25C] focus:ring-[#B8F25C] rounded"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" className="text-white hover:text-[#B8F25C] underline decoration-white/30 hover:decoration-[#B8F25C]">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-white hover:text-[#B8F25C] underline decoration-white/30 hover:decoration-[#B8F25C]">
                Privacy Policy
              </Link>
            </span>
          </label>
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
              Create Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-white/60">
        <p>
          Already have an account?{' '}
          <Link href={`/sign-in${nextUrl !== '/app' ? `?next=${nextUrl}` : ''}`} className="text-[#B8F25C] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
