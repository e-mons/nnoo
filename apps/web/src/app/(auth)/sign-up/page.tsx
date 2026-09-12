import SignUpForm from '@/components/auth/SignUpForm';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Sign Up | NNOO',
  description: 'Create your NNOO account.',
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}
