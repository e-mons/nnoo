import React from 'react';
import Link from 'next/link';
import { requireServerAdmin } from '@/lib/auth/admin-guard';
import { ShieldCheck, Users, Briefcase, Activity, CreditCard, Cpu } from 'lucide-react';
import { signOutAction } from '@/lib/actions/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, adminRecord } = await requireServerAdmin();

  return (
    <div className="flex min-h-screen bg-[#0A1C16]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A1C16] border-r border-[rgba(255,255,255,0.1)] flex flex-col">
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-2 text-white">
            <ShieldCheck className="h-6 w-6 text-[#B8F25C]" />
            <span className="text-xl font-bold tracking-tight">NNOO Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <Activity className="h-5 w-5 opacity-70" />
            <span className="font-medium">Overview</span>
          </Link>
          <Link href="/admin/intelligence" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <Cpu className="h-5 w-5 text-[#B8F25C]" />
            <span className="font-medium text-[#B8F25C]">Intelligence</span>
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <Users className="h-5 w-5 opacity-70" />
            <span className="font-medium">Users</span>
          </Link>
          <Link href="/admin/businesses" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <Briefcase size={20} className="text-[#B8F25C]" />
            <span className="font-medium">Businesses</span>
          </Link>
          <Link href="/admin/billing" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <CreditCard className="h-5 w-5 text-[#B8F25C]" />
            <span className="font-medium">Billing</span>
          </Link>
          <Link href="/admin/enquiries" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#B8F25C]"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
            <span className="font-medium">Enquiries</span>
          </Link>
          <Link href="/admin/audit" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <ShieldCheck className="h-5 w-5 opacity-70" />
            <span className="font-medium">Audit Log</span>
          </Link>
        </nav>


        <div className="p-6 border-t border-[rgba(255,255,255,0.1)] flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-white font-bold shrink-0">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden text-sm">
              <p className="text-white font-medium truncate">{user.email}</p>
              <p className="text-[#B8F25C] text-xs uppercase font-bold tracking-wider">{adminRecord.role.replace('_', ' ')}</p>
            </div>
          </div>
          <form action={signOutAction} className="w-full">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(255,255,255,0.1)] hover:text-[#B8F25C] transition-colors text-sm font-semibold"
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#07130F]">
        {children}
      </main>
    </div>
  );
}
