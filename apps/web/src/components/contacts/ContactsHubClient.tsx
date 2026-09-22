'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MessageCircle, 
  TrendingUp, 
  TrendingDown,
  Building,
  User,
  Settings
} from 'lucide-react';
import { CustomerActions } from '@/components/customers/customer-actions';
import { SupplierActions } from '@/components/suppliers/supplier-actions';

interface ContactsHubProps {
  businessId: string;
  businessSlug: string;
  initialTab?: string;
  customers: any[];
  suppliers: any[];
}

export function ContactsHubClient({
  businessId,
  businessSlug,
  initialTab = 'customers',
  customers = [],
  suppliers = [],
}: ContactsHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || initialTab;

  const [searchQuery, setSearchQuery] = useState('');

  const setTab = (tab: string) => {
    router.replace(`/app/${businessSlug}/contacts?tab=${tab}`, { scroll: false });
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery)) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.phone && s.phone.includes(searchQuery)) ||
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header & Quick Action Hub */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8F25C]/10 border border-[#B8F25C]/20 text-[#B8F25C] text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            Address Book & Relationships
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Customers & Suppliers</h1>
          <p className="text-white/60 text-sm mt-1">
            Keep track of who buys from you, who supplies you, contact details, and balances.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Link
            href={`/app/${businessSlug}/customers/new`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] font-bold text-sm shadow-lg shadow-[#B8F25C]/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Customer</span>
          </Link>

          <Link
            href={`/app/${businessSlug}/suppliers/new`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-sm transition-all"
          >
            <Truck className="w-4 h-4 text-[#B8F25C]" />
            <span>+ Add Supplier</span>
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Total Customers</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2 tabular-nums">{customers.length}</p>
          <p className="text-xs text-white/50 mt-1 font-medium">Registered buyers</p>
        </div>

        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Active Customers</span>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2 tabular-nums">
            {customers.filter((c) => c.status === 'active').length}
          </p>
          <p className="text-xs text-white/50 mt-1 font-medium">Currently buying</p>
        </div>

        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Total Suppliers</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-300 mt-2 tabular-nums">{suppliers.length}</p>
          <p className="text-xs text-white/50 mt-1 font-medium">Product & service vendors</p>
        </div>

        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Active Suppliers</span>
            <div className="p-2 rounded-xl bg-[#B8F25C]/20 text-[#B8F25C]">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#B8F25C] mt-2 tabular-nums">
            {suppliers.filter((s) => s.status === 'active').length}
          </p>
          <p className="text-xs text-white/50 mt-1 font-medium">Regular deliveries</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 p-1.5 bg-black/30 border border-white/10 rounded-2xl w-fit">
          <button
            onClick={() => setTab('customers')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'customers'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            👥 Customers (Who Buys From You) ({customers.length})
          </button>
          <button
            onClick={() => setTab('suppliers')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'suppliers'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            🚚 Suppliers (Who Supplies You) ({suppliers.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'customers' ? 'Search customers by name or phone...' : 'Search suppliers by name or phone...'
            }
            className="w-full bg-[#143628]/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#B8F25C]/50"
          />
        </div>

        {/* TAB 1: CUSTOMERS */}
        {activeTab === 'customers' && (
          <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
            {filteredCustomers.length === 0 ? (
              <div className="p-16 text-center">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white">No customers found</h3>
                <p className="text-white/50 text-sm mt-1 max-w-sm mx-auto">
                  Add your first customer to record who purchases your goods and track their history.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-white/50 uppercase bg-black/20">
                    <tr>
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4">Phone Number</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            href={`/app/${businessSlug}/customers/${customer.id}`}
                            className="font-bold text-white hover:text-[#B8F25C] transition flex items-center gap-2"
                          >
                            {customer.type === 'business' ? (
                              <Building className="w-4 h-4 text-sky-400 shrink-0" />
                            ) : (
                              <User className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                            <span>{customer.name}</span>
                          </Link>
                          {customer.email && (
                            <div className="text-xs text-white/40 mt-0.5">{customer.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {customer.phone ? (
                            <div className="flex items-center gap-2">
                              <span className="text-white/90 font-mono">{customer.phone}</span>
                              <a
                                href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-white/30 italic">No phone</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize text-xs font-semibold px-2 py-1 rounded bg-white/5 text-white/70">
                            {customer.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                              customer.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-white/10 text-white/40'
                            }`}
                          >
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/app/${businessSlug}/customers/${customer.id}`}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition"
                            >
                              Profile
                            </Link>
                            <CustomerActions
                              businessId={businessId}
                              businessSlug={businessSlug}
                              customerId={customer.id}
                              currentStatus={customer.status}
                              canArchive={true}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUPPLIERS */}
        {activeTab === 'suppliers' && (
          <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
            {filteredSuppliers.length === 0 ? (
              <div className="p-16 text-center">
                <Truck className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white">No suppliers found</h3>
                <p className="text-white/50 text-sm mt-1 max-w-sm mx-auto">
                  Add your suppliers and wholesalers to log inventory shipments and manage purchase payables.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-white/50 uppercase bg-black/20">
                    <tr>
                      <th className="px-6 py-4">Supplier Name</th>
                      <th className="px-6 py-4">Phone Number</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            href={`/app/${businessSlug}/suppliers/${supplier.id}`}
                            className="font-bold text-white hover:text-[#B8F25C] transition flex items-center gap-2"
                          >
                            <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>{supplier.name}</span>
                          </Link>
                          {supplier.email && (
                            <div className="text-xs text-white/40 mt-0.5">{supplier.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {supplier.phone ? (
                            <div className="flex items-center gap-2">
                              <span className="text-white/90 font-mono">{supplier.phone}</span>
                              <a
                                href={`https://wa.me/${supplier.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-white/30 italic">No phone</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize text-xs font-semibold px-2 py-1 rounded bg-white/5 text-white/70">
                            {supplier.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                              supplier.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-white/10 text-white/40'
                            }`}
                          >
                            {supplier.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/app/${businessSlug}/suppliers/${supplier.id}`}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition"
                            >
                              Profile
                            </Link>
                            <SupplierActions
                              businessId={businessId}
                              businessSlug={businessSlug}
                              supplierId={supplier.id}
                              currentStatus={supplier.status}
                              canArchive={true}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
