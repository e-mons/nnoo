'use client';

import { useState } from 'react';
import { inviteTeamMember } from '@/lib/actions/team';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function InviteMemberForm({ 
  businessId, 
  businessSlug 
}: { 
  businessId: string;
  businessSlug: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInviteLink(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await inviteTeamMember(businessId, businessSlug, formData);

    if (result.error) {
      setError(result.error);
    } else if (result.success && result.inviteLink) {
      // In a real app with a mailer, we wouldn't show this link directly.
      // But for MVP/testing, we generate the absolute URL and show it to the owner so they can copy it.
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}${result.inviteLink}`);
      form.reset();
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <Mail className="w-5 h-5 text-[#B8F25C]" />
        Invite New Member
      </h3>
      <p className="text-white/60 text-sm mb-6">
        Send an invitation email to add a staff member, manager, or accountant to your business.
      </p>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {inviteLink && (
        <div className="mb-6 bg-[#B8F25C]/10 border border-[#B8F25C]/30 p-4 rounded-xl space-y-2">
          <p className="text-[#B8F25C] text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Invitation Generated Successfully!
          </p>
          <p className="text-white/70 text-xs">
            Normally this would be sent via email. For testing, share this secure link with the user:
          </p>
          <input 
            type="text" 
            readOnly 
            value={inviteLink} 
            className="w-full bg-[#0A1C16] border border-[#B8F25C]/30 text-white text-xs p-2 rounded-lg"
            onClick={(e) => e.currentTarget.select()}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-6">
          <label className="block text-sm font-medium text-white/70 mb-2">Email Address *</label>
          <input
            type="email"
            name="email"
            placeholder="cashier@example.com"
            required
            className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
          />
        </div>
        <div className="md:col-span-4">
          <label className="block text-sm font-medium text-white/70 mb-2">Role *</label>
          <select
            name="role"
            required
            className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 transition-colors"
          >
            <option value="sales_staff">Sales Staff</option>
            <option value="inventory_staff">Inventory Staff</option>
            <option value="manager">Manager</option>
            <option value="accountant">Accountant</option>
            <option value="business_admin">Administrator</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Invite'}
          </button>
        </div>
      </form>
    </div>
  );
}
