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
  ShoppingCart, 
  Package, 
  Tag, 
  Receipt, 
  FileText, 
  CreditCard, 
  Users, 
  Truck, 
  BarChart, 
  TrendingUp,
  MessageSquare,
  Activity,
  FileBadge,
  Clock,
  Bell,
  Settings 
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '', icon: LayoutDashboard, module: 'dashboard' as FeatureModule },
  { name: 'Notifications', href: '/notifications', icon: Bell, module: 'notifications' as FeatureModule },
  { name: 'Ask NNOO', href: '/assistant', icon: MessageSquare, module: 'assistant' as FeatureModule },
  { name: 'AI Bookkeeper', href: '/bookkeeper', icon: Sparkles, module: 'bookkeeper' as FeatureModule },
  { name: 'Business Insights', href: '/insights', icon: TrendingUp, module: 'insights' as FeatureModule },
  { name: 'Business Health', href: '/health', icon: Activity, module: 'health_score' as FeatureModule },
  { name: 'Credit Passport', href: '/credit-passport', icon: FileBadge, module: 'credit_passport' as FeatureModule },
  { name: 'Automations', href: '/automations', icon: Clock, module: 'automations' as FeatureModule },
  { name: 'Sales', href: '/sales', icon: ShoppingCart, module: 'sales' as FeatureModule },
  { name: 'Invoices', href: '/invoices', icon: FileText, module: 'invoices' as FeatureModule },
  { name: 'Receipts', href: '/receipts', icon: Receipt, module: 'receipts' as FeatureModule },
  { name: 'Inventory', href: '/inventory', icon: Package, module: 'inventory' as FeatureModule },
  { name: 'Products', href: '/products', icon: Tag, module: 'products' as FeatureModule },
  { name: 'Expenses', href: '/expenses', icon: CreditCard, module: 'expenses' as FeatureModule },
  { name: 'Customers', href: '/customers', icon: Users, module: 'customers' as FeatureModule },
  { name: 'Suppliers', href: '/suppliers', icon: Truck, module: 'suppliers' as FeatureModule },
  { name: 'Reports', href: '/reports', icon: BarChart, module: 'reports' as FeatureModule },
  { name: 'Settings', href: '/settings', icon: Settings, module: 'settings' as FeatureModule },
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
            priority
          />
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {navItems
          .filter(item => hasPermission(activeMembership?.role, item.module))
          .map((item) => {
            const href = `/app/${businessSlug}${item.href}`;
          // Active if pathname exactly matches href OR if it starts with href/ (for sub-pages),
          // except for dashboard where it must be exact.
          const isActive = item.href === '' 
            ? pathname === `/app/${businessSlug}`
            : pathname.startsWith(href);

          return (
            <Link
              key={item.name}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-[rgba(184,242,92,0.1)] text-[#B8F25C]'
                  : 'text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
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
