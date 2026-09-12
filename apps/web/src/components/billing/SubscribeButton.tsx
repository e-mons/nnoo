'use client';

import { useState } from 'react';
import { initializeSubscriptionCheckout } from '@/lib/actions/billing';
import { useRouter } from 'next/navigation';

export default function SubscribeButton({ businessId, planCode, price, buttonText = "Subscribe" }: { businessId: string, planCode: string, price: number, buttonText?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await initializeSubscriptionCheckout({
        businessId,
        planCode
      });
      // Redirect to Paystack
      window.location.href = res.authorizationUrl;
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to initialize checkout');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="mt-4 w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
    >
      {loading ? "Starting secure checkout..." : buttonText}
    </button>
  );
}
