'use client';

import React, { useState } from 'react';
import { suspendUserAction, restoreUserAction } from '../../../../lib/actions/admin';
import { useRouter } from 'next/navigation';

export function UserStatusActions({ userId, currentStatus }: { userId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleAction = async () => {
    if (currentStatus === 'active' && reason.trim().length < 5) {
      setError('Please provide a valid reason for suspension (at least 5 characters).');
      return;
    }

    setLoading(true);
    setError(null);

    let res;
    if (currentStatus === 'active') {
      res = await suspendUserAction(userId, reason);
    } else {
      res = await restoreUserAction(userId, reason || 'Administrative restoration');
    }

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setShowConfirm(false);
      setReason('');
      router.refresh();
    }
  };

  return (
    <div className="mt-6 border-t border-[rgba(255,255,255,0.1)] pt-6">
      <h3 className="text-lg font-medium text-white mb-4">Danger Zone</h3>
      
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            currentStatus === 'active' 
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
              : 'bg-[rgba(184,242,92,0.1)] text-[#B8F25C] hover:bg-[rgba(184,242,92,0.2)]'
          }`}
        >
          {currentStatus === 'active' ? 'Suspend User' : 'Restore User'}
        </button>
      ) : (
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] p-4 rounded-xl max-w-md space-y-4">
          <p className="text-sm text-[rgba(255,255,255,0.8)]">
            Are you sure you want to {currentStatus === 'active' ? 'suspend' : 'restore'} this user?
          </p>
          
          <div className="space-y-1">
            <label className="text-xs text-[rgba(255,255,255,0.6)]">Reason (required for suspension)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#B8F25C]"
              placeholder="e.g. Violation of terms"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleAction}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                currentStatus === 'active'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-[#B8F25C] text-[#0A1C16] hover:bg-[#a3db4e]'
              } disabled:opacity-50`}
            >
              {loading ? 'Processing...' : 'Confirm'}
            </button>
            <button
              onClick={() => {
                setShowConfirm(false);
                setError(null);
              }}
              disabled={loading}
              className="px-4 py-2 rounded-lg font-medium text-sm text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
