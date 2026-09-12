/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { requireServerAdmin } from '@/lib/auth/admin-guard';
import Link from 'next/link';
import { ChevronLeft, User as UserIcon } from 'lucide-react';
import { UserStatusActions } from './UserStatusActions';

export const metadata = {
  title: 'User Details - NNOO Admin',
};

export default async function AdminUserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireServerAdmin();
  const resolvedParams = await params;

  const adminClient = createAdminClient();

  // Fetch the user's profile, memberships, and auth details
  const [profileResult, membershipsResult, authUserResult] = await Promise.all([
    adminClient.from('profiles').select('*').eq('id', resolvedParams.id).single(),
    adminClient
      .from('business_memberships')
      .select('id, role, membership_status, created_at, business:businesses(name)')
      .eq('user_id', resolvedParams.id),
    adminClient.auth.admin.getUserById(resolvedParams.id).catch(() => ({ data: { user: null }, error: null })),
  ]);

  if (profileResult.error || !profileResult.data) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <p className="text-red-400">User not found or error loading profile.</p>
        <Link href="/admin/users" className="text-[#B8F25C] hover:underline mt-4 inline-block">Back to Users</Link>
      </div>
    );
  }

  const profile = profileResult.data;
  const memberships = membershipsResult.data || [];
  const authUser = authUserResult?.data?.user;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <Link href="/admin/users" className="inline-flex items-center text-sm text-[rgba(255,255,255,0.6)] hover:text-white transition-colors mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Users
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-[rgba(255,255,255,0.05)] rounded-full border border-[rgba(255,255,255,0.1)] flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-[rgba(255,255,255,0.4)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {profile.first_name || profile.last_name ? `${profile.first_name} ${profile.last_name}` : (authUser?.email || 'Unknown User')}
              </h1>
              <p className="text-[rgba(255,255,255,0.6)] text-sm font-mono mt-1">{profile.id}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            profile.account_status === 'active' 
              ? 'bg-[rgba(184,242,92,0.1)] text-[#B8F25C]' 
              : 'bg-red-500/10 text-red-400'
          }`}>
            {profile.account_status}
          </span>
        </div>
      </div>

      <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Email Address</label>
            <p className="text-white font-mono text-sm">{authUser?.email || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Phone</label>
            <p className="text-white">{profile.phone || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">First Name</label>
            <p className="text-white">{profile.first_name || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Last Name</label>
            <p className="text-white">{profile.last_name || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Joined Date</label>
            <p className="text-white">{new Date(profile.created_at).toLocaleString()}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Last Sign In</label>
            <p className="text-white">{authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : '—'}</p>
          </div>
        </div>

        <UserStatusActions userId={profile.id} currentStatus={profile.account_status} />
      </div>

      <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)]">
          <h2 className="text-lg font-medium text-white">Business Memberships</h2>
        </div>
        
        {memberships.length > 0 ? (
          <div className="divide-y divide-[rgba(255,255,255,0.05)]">
            {memberships.map((m: any) => (
              <div key={m.id} className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{m.business?.name || 'Unknown Business'}</h3>
                  <p className="text-sm text-[rgba(255,255,255,0.5)] mt-1">
                    Role: <span className="text-white capitalize">{m.role.replace('_', ' ')}</span>
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  m.membership_status === 'active' ? 'bg-[rgba(255,255,255,0.1)] text-white' : 'bg-red-500/10 text-red-400'
                }`}>
                  {m.membership_status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-[rgba(255,255,255,0.5)]">
            This user does not belong to any businesses.
          </div>
        )}
      </div>
    </div>
  );
}
