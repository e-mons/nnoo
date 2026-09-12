import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signOutAction } from '@/lib/actions/auth';
import { BusinessProvider, BusinessMembership } from '@/components/providers/BusinessProvider';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export const metadata: Metadata = {
  title: 'Dashboard | NNOO',
  description: 'NNOO Authenticated Area',
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Verify if platform admin (Admins shouldn't access the app)
  const { data: adminRecord } = await supabase
    .from('platform_admins')
    .select('status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (adminRecord) {
    redirect('/admin');
  }

  // Verify platform account status
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_status')
    .eq('id', user.id)
    .single();

  if (profile?.account_status === 'suspended') {
    redirect('/suspended');
  }

  // Fetch business memberships
  const { data: memberships } = await supabase
    .from('business_memberships')
    .select('*, business:businesses(*)')
    .eq('user_id', user.id)
    .eq('membership_status', 'active');

  const allMemberships = memberships || [];
  const activeMemberships = allMemberships.filter((m) => m.business?.status === 'active');
  const hasSuspendedBusiness = allMemberships.some((m) => m.business?.status === 'suspended');

  if (activeMemberships.length === 0) {
    if (hasSuspendedBusiness) {
      redirect('/business-suspended');
    }
    redirect('/onboarding');
  }

  return (
    <BusinessProvider initialMemberships={activeMemberships as unknown as BusinessMembership[]}>
      <div className="min-h-screen bg-[#0A1C16] flex text-white selection:bg-[#B8F25C] selection:text-[#0A1C16]">
        
        {/* Persistent Desktop Sidebar */}
        <AppSidebar />

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="sticky top-0 z-40 bg-[#0A1C16]/80 backdrop-blur-md border-b border-white/10 h-16 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3 lg:hidden">
              <Link href="/app" aria-label="NNOO Home">
                <Image
                  src="/logo-dark-horizontal.png"
                  alt="NNOO Logo"
                  width={100}
                  height={28}
                  className="object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                  priority
                />
              </Link>
            </div>
            
            {/* Spacer for desktop since logo is in sidebar */}
            <div className="hidden lg:block flex-1" />

          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm font-medium text-white/80 hidden sm:block bg-[rgba(255,255,255,0.05)] px-3 py-1.5 rounded-full border border-white/10">
              {user.email}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-sm font-semibold text-white hover:bg-[rgba(255,255,255,0.1)] hover:text-[#B8F25C] transition-all border border-white/10 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Sign Out
              </button>
            </form>
          </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </BusinessProvider>
  );
}
