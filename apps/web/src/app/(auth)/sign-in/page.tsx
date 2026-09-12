import SignInForm from '@/components/auth/SignInForm';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Sign In | NNOO',
  description: 'Sign in to your NNOO account.',
};

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
