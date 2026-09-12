'use client';

import { useState, useRef, useEffect } from 'react';
import { MailCheck, Loader2, ArrowRight, RefreshCw, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmailOtpAction, resendOtpAction } from '@/lib/actions/auth';

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Focus the first input on load
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  const handleOtpChange = (index: number, value: string) => {
    // Handle typing single character or pasted numbers
    const cleanVal = value.replace(/\D/g, '');

    if (cleanVal.length > 1) {
      // Pasted full or partial code
      const pastedDigits = cleanVal.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedDigits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanVal;
    setOtp(newOtp);

    // Auto-advance to next input if digit entered
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move back and clear previous
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || '';
      }
      setOtp(newOtp);
      const targetIndex = Math.min(pastedData.length, 5);
      inputRefs.current[targetIndex]?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setResendSuccess(false);

    if (!email) {
      setError('Please enter the email address associated with your account.');
      return;
    }

    const token = otp.join('');
    if (token.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyEmailOtpAction({ email, token });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else if (result?.success) {
        router.push(result.redirectTo || '/onboarding');
      }
    } catch {
      setError('An unexpected error occurred during verification. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending || !email) return;

    setError(null);
    setIsResending(true);
    setResendSuccess(false);

    try {
      const result = await resendOtpAction({ email });
      if (result?.error) {
        setError(result.error);
      } else {
        setResendSuccess(true);
        setCanResend(false);
        setCountdown(60);
      }
    } catch {
      setError('Failed to resend verification code. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-[#B8F25C]/20 border border-[#B8F25C]/30 flex items-center justify-center shadow-lg shadow-[#B8F25C]/5">
            <MailCheck className="w-8 h-8 text-[#B8F25C]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Verify your email</h1>
        <p className="text-white/60 text-sm max-w-sm mx-auto">
          We&apos;ve sent a 6-digit verification code to
          {email ? (
            <span className="block font-semibold text-white mt-1">{email}</span>
          ) : (
            ' your email address'
          )}
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        {resendSuccess && (
          <div className="p-3.5 rounded-xl bg-[#B8F25C]/10 border border-[#B8F25C]/20 text-[#B8F25C] text-sm font-medium">
            A new verification code has been dispatched to your email.
          </div>
        )}

        {!emailParam && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wide px-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full px-4 py-3 bg-[#0A1C16]/50 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#B8F25C]/50 focus:border-[#B8F25C] transition-all"
              placeholder="name@business.com"
            />
          </div>
        )}

        {/* 6-Digit OTP Input Boxes */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/80 uppercase tracking-wide block text-center">
            Enter 6-Digit Code
          </label>
          <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold bg-[#0A1C16]/60 border border-white/15 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-[#B8F25C] focus:border-[#B8F25C] transition-all shadow-inner disabled:opacity-50"
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || otp.join('').length !== 6}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#B8F25C] hover:bg-[#a6de4d] text-[#0A1C16] font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-[#B8F25C]/10 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Verifying Code...</span>
            </>
          ) : (
            <>
              <span>Verify & Continue</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        {/* Resend Code Section */}
        <div className="text-center pt-2 space-y-3">
          <p className="text-white/50 text-xs">
            Didn&apos;t receive the code? Check your spam folder or
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || isResending}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#B8F25C] hover:text-[#a6de4d] disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
          >
            {isResending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Resending...</span>
              </>
            ) : canResend ? (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Resend Code</span>
              </>
            ) : (
              <span>Resend code in {countdown}s</span>
            )}
          </button>
        </div>

        <div className="border-t border-white/10 pt-4 text-center">
          <Link
            href="/sign-in"
            className="text-xs font-semibold text-white/60 hover:text-white transition-colors"
          >
            ← Return to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
