import { Suspense } from 'react';
import { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import VerifyEmailForm from '@/components/auth/VerifyEmailForm';

export const metadata: Metadata = {
  title: 'Verify Email | NNOO',
  description: 'Enter your 6-digit verification code to activate your NNOO business workspace.',
};

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#B8F25C] animate-spin" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
