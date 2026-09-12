import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { signOutAction } from '@/lib/actions/auth';

export const metadata = {
  title: 'Account Suspended - NNOO',
};

export default function SuspendedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto px-6">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Account Suspended</h1>
      <p className="text-[rgba(255,255,255,0.6)] mb-8">
        Your access to the NNOO platform has been restricted by an administrator. Please contact support if you believe this is an error.
      </p>
      
      <form action={signOutAction}>
        <button
          type="submit"
          className="w-full bg-[#B8F25C] text-[#0A1C16] font-bold py-3 px-4 rounded-lg hover:bg-[#a3db4e] transition-colors"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}
