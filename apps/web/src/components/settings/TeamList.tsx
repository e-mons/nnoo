'use client';

import { useState } from 'react';
import { revokeInvitation, updateMemberRole } from '@/lib/actions/team';
import { User, MoreVertical, X, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function TeamList({ 
  members, 
  invitations, 
  businessSlug 
}: { 
  members: any[];
  invitations: any[];
  businessSlug: string;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRevoke = async (id: string) => {
    setLoadingId(id);
    await revokeInvitation(businessSlug, id);
    setLoadingId(null);
  };

  const handleRoleChange = async (membershipId: string, newRole: string) => {
    setLoadingId(membershipId);
    await updateMemberRole(businessSlug, membershipId, newRole, 'active');
    setLoadingId(null);
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    setLoadingId(membershipId);
    await updateMemberRole(businessSlug, membershipId, 'read_only', 'suspended');
    setLoadingId(null);
  };

  const roles = [
    { value: 'owner', label: 'Owner' },
    { value: 'business_admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'sales_staff', label: 'Sales Staff' },
    { value: 'inventory_staff', label: 'Inventory Staff' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'read_only', label: 'Read Only' }
  ];

  return (
    <div className="space-y-8">
      {/* Active Members */}
      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-[#B8F25C]" />
            Active Team Members
          </h3>
        </div>
        <div className="divide-y divide-white/5">
          {members.map((member) => (
            <div key={member.membership_id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-[#0A1C16] border border-white/10 rounded-full flex items-center justify-center text-[#B8F25C] font-bold">
                  {(member.first_name?.[0] || member.email?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {member.first_name || member.last_name ? `${member.first_name || ''} ${member.last_name || ''}`.trim() : member.email}
                  </p>
                  <p className="text-white/50 text-xs">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <select
                  disabled={loadingId === member.membership_id}
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.membership_id, e.target.value)}
                  className="bg-[#0A1C16] border border-white/10 text-white text-sm rounded-lg focus:ring-[#B8F25C] focus:border-[#B8F25C] p-2 disabled:opacity-50"
                >
                  {roles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                
                <button
                  onClick={() => handleRemoveMember(member.membership_id)}
                  disabled={loadingId === member.membership_id}
                  className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Remove Member"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="p-8 text-center text-white/50">
              No active members found.
            </div>
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-yellow-500" />
              Pending Invitations
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {invitations.map((inv) => (
              <div key={inv.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="text-white font-medium">{inv.email}</p>
                  <p className="text-white/50 text-xs">
                    Invited as <span className="capitalize text-[#B8F25C]">{inv.role.replace('_', ' ')}</span> • 
                    Expires {new Date(inv.expires_at).toLocaleDateString('en-US')}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  disabled={loadingId === inv.id}
                  className="text-sm px-4 py-2 border border-white/10 rounded-lg text-white/70 hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-50"
                >
                  {loadingId === inv.id ? 'Revoking...' : 'Revoke'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
