'use client';

import React, { useState } from 'react';
import { grantBillingAccessOverride, revokeBillingAccessOverride } from '@/lib/actions/admin-billing';
import { useRouter } from 'next/navigation';

export function BillingOverrideActions({
  businessId,
  activeOverrides,
}: {
  businessId: string;
  activeOverrides: Array<{
    id: string;
    override_type: string;
    reason: string;
    starts_at: string;
    ends_at: string | null;
  }>;
}) {
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [overrideType, setOverrideType] = useState('grace_period');
  const [endsAt, setEndsAt] = useState('');
  const [grantReason, setGrantReason] = useState('');

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (grantReason.trim().length < 5) {
      setError('A valid reason (minimum 5 characters) is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await grantBillingAccessOverride({
        businessId,
        overrideType,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        reason: grantReason.trim(),
      });
      setShowGrantModal(false);
      setGrantReason('');
      setEndsAt('');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to grant billing override');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokingId) return;
    if (revokeReason.trim().length < 5) {
      setError('A valid revocation reason (minimum 5 characters) is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await revokeBillingAccessOverride(revokingId, revokeReason.trim());
      setRevokingId(null);
      setRevokeReason('');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke billing override');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Billing Access Overrides</h3>
        <button
          type="button"
          onClick={() => {
            setShowGrantModal(true);
            setError(null);
          }}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors"
        >
          + Grant Access Override
        </button>
      </div>

      {activeOverrides.length > 0 ? (
        <div className="space-y-2">
          {activeOverrides.map((ovr) => (
            <div key={ovr.id} className="p-3 bg-[#0f1211] border border-[#2a302c] rounded-lg flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 uppercase font-mono font-bold text-[10px]">
                    {ovr.override_type.replace('_', ' ')}
                  </span>
                  <span className="text-gray-400">
                    Expires: {ovr.ends_at ? new Date(ovr.ends_at).toLocaleDateString() : 'Indefinite'}
                  </span>
                </div>
                <p className="text-gray-300 italic">&ldquo;{ovr.reason}&rdquo;</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRevokingId(ovr.id);
                  setRevokeReason('');
                  setError(null);
                }}
                className="px-2 py-1 bg-rose-950 text-rose-300 border border-rose-800 rounded hover:bg-rose-900 font-semibold"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500">No active billing overrides for this business.</p>
      )}

      {/* Grant Override Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a302c] pb-3">
              <h3 className="text-base font-bold text-white">Grant Billing Access Override</h3>
              <button onClick={() => setShowGrantModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {error && (
              <div className="p-3 bg-red-950 border border-red-800 rounded text-red-300 text-xs">{error}</div>
            )}

            <form onSubmit={handleGrant} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Override Type</label>
                <select
                  value={overrideType}
                  onChange={(e) => setOverrideType(e.target.value)}
                  className="w-full bg-[#0f1211] border border-[#2a302c] rounded p-2 text-white"
                >
                  <option value="grace_period">Grace Period (Temporary Payment Extension)</option>
                  <option value="trial_extension">Trial Extension</option>
                  <option value="promotional_grant">Promotional Grant</option>
                  <option value="manual_support_unlock">Manual Support Unlock</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full bg-[#0f1211] border border-[#2a302c] rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Audit Rationale (min 5 characters)</label>
                <textarea
                  required
                  rows={3}
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="e.g. Customer bank payment transfer pending confirmation..."
                  className="w-full bg-[#0f1211] border border-[#2a302c] rounded p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-3 py-1.5 bg-[rgba(255,255,255,0.05)] text-gray-300 rounded hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loading ? 'Granting...' : 'Grant Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Override Modal */}
      {revokingId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1f1c] border border-[#2a302c] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a302c] pb-3">
              <h3 className="text-base font-bold text-white">Revoke Billing Access Override</h3>
              <button onClick={() => setRevokingId(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {error && (
              <div className="p-3 bg-red-950 border border-red-800 rounded text-red-300 text-xs">{error}</div>
            )}

            <div className="space-y-3 text-xs">
              <p className="text-gray-300">
                Please provide an audit rationale for revoking this billing override.
              </p>
              <div>
                <label className="block text-gray-400 mb-1">Revocation Reason (min 5 characters)</label>
                <textarea
                  required
                  rows={3}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Issue resolved or expired..."
                  className="w-full bg-[#0f1211] border border-[#2a302c] rounded p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevokingId(null)}
                  className="px-3 py-1.5 bg-[rgba(255,255,255,0.05)] text-gray-300 rounded hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading || revokeReason.trim().length < 5}
                  onClick={handleRevoke}
                  className="px-4 py-1.5 bg-rose-600 text-white font-bold rounded hover:bg-rose-500 disabled:opacity-50"
                >
                  {loading ? 'Revoking...' : 'Confirm Revoke'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
