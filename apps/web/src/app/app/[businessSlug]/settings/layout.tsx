import { ReactNode } from 'react';
import Link from 'next/link';
import { Settings, CreditCard, Users, MessageSquare, Clock, Bell } from 'lucide-react';
import { requireRole } from '@/lib/auth/rbac';

export default async function SettingsLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;

  await requireRole(businessSlug, 'settings');

  const navItems = [
    {
      name: 'Store Details',
      href: `/app/${businessSlug}/settings`,
      icon: Settings,
      matchStart: false
    },
    {
      name: 'Staff & Helpers',
      href: `/app/${businessSlug}/settings/team`,
      icon: Users,
      matchStart: true
    },
    {
      name: 'WhatsApp Business',
      href: `/app/${businessSlug}/settings/whatsapp`,
      icon: MessageSquare,
      matchStart: true
    },
    {
      name: 'Automations & Schedules',
      href: `/app/${businessSlug}/settings/automations`,
      icon: Clock,
      matchStart: true
    },
    {
      name: 'Plan & Billing',
      href: `/app/${businessSlug}/settings/billing`,
      icon: CreditCard,
      matchStart: true
    },
    {
      name: 'Attention & Alerts',
      href: `/app/${businessSlug}/settings/notifications`,
      icon: Bell,
      matchStart: true
    }
  ];


  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-[#B8F25C]" />
            Settings
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Manage your business profile and billing preferences.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <nav className="w-full md:w-64 shrink-0 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-white/10 text-white/70 hover:text-white"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
