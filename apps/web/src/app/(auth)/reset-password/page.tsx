import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | NNOO',
  description: 'Create a new password for your NNOO account.',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
