import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { signOutAction } from '@/lib/actions/auth';
import Link from 'next/link';

export const metadata = {
  title: 'Business Suspended - NNOO',
};

export default function BusinessSuspendedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto px-6">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Business Suspended</h1>
      <p className="text-[rgba(255,255,255,0.6)] mb-8">
        The business you are trying to access has been suspended by a platform administrator. 
        If you believe this is an error, please contact NNOO support.
      </p>
      
      <div className="flex flex-col w-full gap-3">
        <Link
          href="/onboarding"
          className="w-full bg-[rgba(255,255,255,0.05)] text-white border border-[rgba(255,255,255,0.1)] font-bold py-3 px-4 rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors"
        >
          Create New Business
        </Link>
        <form action={signOutAction} className="w-full">
          <button
            type="submit"
            className="w-full bg-[#B8F25C] text-[#0A1C16] font-bold py-3 px-4 rounded-lg hover:bg-[#a3db4e] transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
