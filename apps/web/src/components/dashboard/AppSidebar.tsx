"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useParams } from 'next/navigation';
import { useBusiness } from '@/components/providers/BusinessProvider';
import { hasPermission, FeatureModule } from '@/lib/auth/rbac-client';
import { 
  LayoutDashboard, 
  Sparkles, 
  DollarSign, 
  Package, 
  Users, 
  Settings 
} from 'lucide-react';

interface HubNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  modules: FeatureModule[];
  exact?: boolean;
}

const hubNavItems: HubNavItem[] = [
  { 
    name: 'Dashboard', 
    href: '', 
    icon: LayoutDashboard, 
    modules: ['dashboard'],
    exact: true 
  },
  { 
    name: 'Money & Sales', 
    href: '/money', 
    icon: DollarSign, 
    modules: ['sales', 'invoices', 'receipts', 'expenses', 'bookkeeper', 'reports'] 
  },
  { 
    name: 'Items & Stock', 
    href: '/stock', 
    icon: Package, 
    modules: ['products', 'inventory'] 
  },
  { 
    name: 'Customers & Suppliers', 
    href: '/contacts', 
    icon: Users, 
    modules: ['customers', 'suppliers'] 
  },
  { 
    name: 'AI Advisor & Health', 
    href: '/advisor', 
    icon: Sparkles, 
    modules: ['assistant', 'insights', 'health_score', 'credit_passport'] 
  },
  { 
    name: 'Store Settings', 
    href: '/settings', 
    icon: Settings, 
    modules: ['settings', 'automations', 'notifications'] 
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { activeMembership } = useBusiness();
  
  // Extract businessSlug. If it's an array, take the first item.
  const rawSlug = params?.businessSlug;
  const businessSlug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (!businessSlug) {
    // If not in a business context (e.g. root /app redirecting), we render a collapsed or empty sidebar
    return (
      <aside className="w-64 flex-shrink-0 bg-[#0A1C16] border-r border-white/10 hidden lg:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
          <Link href="/" aria-label="NNOO Home">
            <Image
              src="/logo-dark-horizontal.png"
              alt="NNOO Logo"
              width={120}
              height={32}
              className="object-contain"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0A1C16] border-r border-white/10 hidden lg:flex flex-col">
      {/* Brand / Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
        <Link href="/" aria-label="NNOO Home">
          <Image
            src="/logo-dark-horizontal.png"
            alt="NNOO Logo"
            width={120}
            height={32}
            className="object-contain"
            style={{ width: 'auto', height: 'auto' }}
            priority
          />
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {hubNavItems
          .filter(item => item.modules.some(mod => hasPermission(activeMembership?.role, mod)))
          .map((item) => {
            const href = `/app/${businessSlug}${item.href}`;
            const isActive = item.exact 
              ? pathname === `/app/${businessSlug}`
              : pathname.startsWith(href);

            return (
              <Link
                key={item.name}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-[rgba(184,242,92,0.12)] text-[#B8F25C]'
                    : 'text-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
                }`}
              >
                <item.icon 
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-[#B8F25C]' : 'text-[rgba(255,255,255,0.4)] group-hover:text-white'
                  }`} 
                />
                {item.name}
              </Link>
            );
          })}
      </div>
    </aside>
  );
}
