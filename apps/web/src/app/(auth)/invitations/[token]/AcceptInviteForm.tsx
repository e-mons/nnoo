'use client';

import { useState } from 'react';
import { acceptInvitation } from '@/lib/actions/team';
import { useRouter } from 'next/navigation';

export default function AcceptInviteForm({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    
    const result = await acceptInvitation(token);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.success && result.businessId) {
      // Redirect to the newly joined business dashboard
      router.push(`/app/${result.businessId}`);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(184,242,92,0.2)] hover:shadow-[0_0_30px_rgba(184,242,92,0.4)] disabled:opacity-50"
      >
        {loading ? 'Accepting...' : 'Accept Invitation'}
      </button>
    </div>
  );
}
