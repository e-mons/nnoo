import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | NNOO',
  description: 'Reset your NNOO account password.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
