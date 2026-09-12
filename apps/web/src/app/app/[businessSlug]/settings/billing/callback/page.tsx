'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifySubscriptionCallback } from '@/lib/actions/billing';
import { use } from 'react';

export default function BillingCallbackPage({
  params
}: {
  params: Promise<{ businessSlug: string }>
}) {
  const { businessSlug } = use(params);
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setErrorMsg('No reference provided.');
      return;
    }

    let isMounted = true;
    
    verifySubscriptionCallback({
      businessId: businessSlug,
      reference
    })
      .then(() => {
        if (isMounted) {
          setStatus('success');
          setTimeout(() => {
            router.push(`/app/${businessSlug}/settings/billing`);
            router.refresh(); // Refresh the layout to update active states
          }, 3000);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setStatus('error');
          setErrorMsg(err.message || 'Verification failed');
        }
      });
      
    return () => { isMounted = false; };
  }, [businessSlug, reference, router]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-[#1a1f1c] p-8 text-center border border-[#2a302c] shadow-xl">
        {status === 'verifying' && (
          <>
            <div className="mb-4 text-emerald-500">
              <svg className="mx-auto h-12 w-12 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Verifying Payment...</h2>
            <p className="mt-2 text-sm text-gray-400">Please wait while we confirm with Paystack.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4 text-emerald-500">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Payment Successful!</h2>
            <p className="mt-2 text-sm text-gray-400">Your subscription is now active.</p>
            <p className="mt-4 text-xs text-gray-500">Redirecting back to billing...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4 text-red-500">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Verification Error</h2>
            <p className="mt-2 text-sm text-gray-400">We couldn't confirm this payment yet.</p>
            <p className="mt-1 text-xs text-red-400">{errorMsg}</p>
            <button
              onClick={() => router.push(`/app/${businessSlug}/settings/billing`)}
              className="mt-6 rounded-md bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
            >
              Return to Billing
            </button>
          </>
        )}
      </div>
    </div>
  );
}
