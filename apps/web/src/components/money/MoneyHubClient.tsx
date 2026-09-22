'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sparkles, 
  Receipt, 
  FileText, 
  CreditCard, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { QuickCaptureForm } from '@/components/bookkeeper/QuickCaptureForm';
import { BookkeeperInbox } from '@/components/bookkeeper/BookkeeperInbox';

interface MoneyHubProps {
  businessId: string;
  businessSlug: string;
  currencyCode: string;
  initialTab?: string;
  sales: any[];
  invoices: any[];
  receipts: any[];
  expenses: any[];
}

export function MoneyHubClient({
  businessId,
  businessSlug,
  currencyCode = 'NGN',
  initialTab = 'activity',
  sales = [],
  invoices = [],
  receipts = [],
  expenses = [],
}: MoneyHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || initialTab;

  const [searchQuery, setSearchQuery] = useState('');

  const setTab = (tab: string) => {
    router.replace(`/app/${businessSlug}/money?tab=${tab}`, { scroll: false });
  };

  const formatMoney = (minor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(minor / 100);
  };

  // Calculations
  const totalSalesMinor = sales.reduce((acc, s) => acc + (Number(s.total_minor) || 0), 0);
  const totalExpensesMinor = expenses
    .filter((e) => e.status !== 'reversed')
    .reduce((acc, e) => acc + (Number(e.total_minor) || 0), 0);
  const netCashMinor = totalSalesMinor - totalExpensesMinor;

  const unpaidInvoices = invoices.filter((i) => i.document_status === 'issued');
  const unpaidInvoicesTotalMinor = unpaidInvoices.reduce(
    (acc, i) => acc + (Number(i.total_minor) || 0),
    0
  );

  // Unified Chronological Activity Feed
  const activityFeed = [
    ...sales.map((s) => ({
      id: `sale-${s.id}`,
      originalId: s.id,
      type: 'sale',
      title: `Sale #${s.sale_number}`,
      party: s.customers?.name || 'Walk-in Customer',
      amountMinor: Number(s.total_minor),
      isMoneyIn: true,
      date: new Date(s.occurred_at),
      status: s.payment_status,
      link: `/app/${businessSlug}/sales/${s.id}`,
    })),
    ...expenses
      .filter((e) => e.status !== 'reversed')
      .map((e) => ({
        id: `expense-${e.id}`,
        originalId: e.id,
        type: 'expense',
        title: e.expense_categories?.name || `Expense #${e.expense_number}`,
        party: e.suppliers?.name || 'Vendor / Supplier',
        amountMinor: Number(e.total_minor),
        isMoneyIn: false,
        date: new Date(e.effective_date),
        status: e.payment_status,
        link: `/app/${businessSlug}/expenses/${e.id}`,
      })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const filteredActivity = activityFeed.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.party.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header & Quick Action Hub */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8F25C]/10 border border-[#B8F25C]/20 text-[#B8F25C] text-xs font-semibold mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            Money & Cashflow Center
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Money & Sales</h1>
          <p className="text-white/60 text-sm mt-1">
            See money coming in, money going out, customer invoices, and record entries in seconds.
          </p>
        </div>

        {/* Big Obvious Action Buttons for Non-Technical Users */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Link
            href={`/app/${businessSlug}/sales/new`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] font-bold text-sm shadow-lg shadow-[#B8F25C]/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Record Sale (Money In)</span>
          </Link>

          <Link
            href={`/app/${businessSlug}/expenses/new`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span>- Record Expense (Money Out)</span>
          </Link>

          <button
            onClick={() => setTab('bookkeeper')}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 font-semibold text-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#B8F25C]" />
            <span>✨ AI Quick Record</span>
          </button>
        </div>
      </div>

      {/* Financial Health Summary Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Total Money In</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2 tabular-nums">
            {formatMoney(totalSalesMinor)}
          </p>
          <p className="text-xs text-emerald-400/80 mt-1 font-medium">From recorded customer sales</p>
        </div>

        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Total Money Out</span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2 tabular-nums">
            {formatMoney(totalExpensesMinor)}
          </p>
          <p className="text-xs text-rose-400/80 mt-1 font-medium">Store & business expenses</p>
        </div>

        <div className="bg-[#143628]/40 border border-[#B8F25C]/30 rounded-3xl p-5 backdrop-blur-xl bg-gradient-to-br from-[#143628]/40 to-[#B8F25C]/5">
          <div className="flex items-center justify-between">
            <span className="text-[#B8F25C] text-xs font-semibold uppercase tracking-wider">Net Cash Remaining</span>
            <div className="p-2 rounded-xl bg-[#B8F25C]/20 text-[#B8F25C]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#B8F25C] mt-2 tabular-nums">
            {formatMoney(netCashMinor)}
          </p>
          <p className="text-xs text-white/50 mt-1 font-medium">Money In minus Money Out</p>
        </div>

        <div className="bg-[#143628]/40 border border-amber-500/20 rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-amber-300/80 text-xs font-semibold uppercase tracking-wider">Who Owes You (Invoices)</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-300 mt-2 tabular-nums">
            {formatMoney(unpaidInvoicesTotalMinor)}
          </p>
          <p className="text-xs text-white/50 mt-1 font-medium">{unpaidInvoices.length} pending customer invoice(s)</p>
        </div>
      </div>

      {/* Main Unified Workspace Tabs */}
      <div className="space-y-6">
        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar p-1.5 bg-black/30 border border-white/10 rounded-2xl">
          <button
            onClick={() => setTab('activity')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'activity'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            📋 All Activity ({activityFeed.length})
          </button>
          <button
            onClick={() => setTab('sales')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'sales'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            🛒 Sales History ({sales.length})
          </button>
          <button
            onClick={() => setTab('invoices')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            📄 Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setTab('expenses')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            💳 Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setTab('receipts')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'receipts'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            🧾 Receipts ({receipts.length})
          </button>
          <button
            onClick={() => setTab('bookkeeper')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'bookkeeper'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            ✨ AI Bookkeeper
          </button>
        </div>

        {/* TAB 1: ALL ACTIVITY FEED */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sales or expenses..."
                  className="w-full bg-[#143628]/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#B8F25C]/50"
                />
              </div>
              <p className="text-xs text-white/50">Showing latest transactions in chronological order</p>
            </div>

            <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
              {filteredActivity.length === 0 ? (
                <div className="p-16 text-center">
                  <Receipt className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white">No transactions recorded yet</h3>
                  <p className="text-white/50 text-sm mt-1 max-w-sm mx-auto">
                    Record your first sale or business expense using the buttons above.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredActivity.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            item.isMoneyIn
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {item.isMoneyIn ? (
                            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={item.link}
                              className="font-bold text-white group-hover:text-[#B8F25C] transition-colors truncate"
                            >
                              {item.title}
                            </Link>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                                item.isMoneyIn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {item.isMoneyIn ? 'Money In' : 'Money Out'}
                            </span>
                          </div>
                          <p className="text-xs text-white/60 truncate mt-0.5">{item.party}</p>
                          <p className="text-[11px] text-white/40 mt-1">
                            {item.date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-4">
                        <span
                          className={`text-base sm:text-lg font-black tabular-nums block ${
                            item.isMoneyIn ? 'text-[#B8F25C]' : 'text-rose-400'
                          }`}
                        >
                          {item.isMoneyIn ? '+' : '-'}
                          {formatMoney(item.amountMinor)}
                        </span>
                        <span
                          className={`inline-block text-[11px] font-semibold capitalize mt-1 px-2 py-0.5 rounded-md ${
                            item.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : item.status === 'partially_paid'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {item.status?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SALES HISTORY */}
        {activeTab === 'sales' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Sales Records</h2>
              <Link
                href={`/app/${businessSlug}/sales/new`}
                className="px-4 py-2 bg-[#B8F25C] text-[#0A1C16] font-bold rounded-xl text-xs hover:bg-[#A3D94E] transition"
              >
                + New Sale
              </Link>
            </div>

            <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
              {sales.length === 0 ? (
                <div className="p-12 text-center text-white/50">No sales recorded yet.</div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white/50 uppercase bg-black/20">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Sale #</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Payment</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-white/70" suppressHydrationWarning>
                            {new Date(sale.occurred_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 font-bold text-[#B8F25C]">
                            <Link href={`/app/${businessSlug}/sales/${sale.id}`} className="hover:underline">
                              {sale.sale_number}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-white">
                            {sale.customers?.name || <span className="italic text-white/40">Walk-in</span>}
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            {formatMoney(Number(sale.total_minor))}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-md font-semibold capitalize ${
                                sale.payment_status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {sale.payment_status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/app/${businessSlug}/sales/${sale.id}`}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition"
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER INVOICES (WHO OWES ME) */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Customer Invoices</h2>
                <p className="text-xs text-white/50">Track unpaid bills and send WhatsApp reminders</p>
              </div>
              <Link
                href={`/app/${businessSlug}/invoices/new`}
                className="px-4 py-2 bg-[#B8F25C] text-[#0A1C16] font-bold rounded-xl text-xs hover:bg-[#A3D94E] transition"
              >
                + Create Invoice
              </Link>
            </div>

            <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
              {invoices.length === 0 ? (
                <div className="p-12 text-center text-white/50">No customer invoices created yet.</div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white/50 uppercase bg-black/20">
                      <tr>
                        <th className="px-6 py-4">Invoice #</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Issue Date</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-white">
                            <Link href={`/app/${businessSlug}/invoices/${inv.id}`} className="hover:text-[#B8F25C]">
                              {inv.invoice_number || 'DRAFT'}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-white/80">{inv.customers?.name || 'Customer'}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                                inv.document_status === 'issued'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : inv.document_status === 'draft'
                                  ? 'bg-white/10 text-white/60'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {inv.document_status === 'issued' ? 'Awaiting Payment' : inv.document_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            {formatMoney(Number(inv.total_minor))}
                          </td>
                          <td className="px-6 py-4 text-xs text-white/60">{inv.issue_date || 'N/A'}</td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/app/${businessSlug}/invoices/${inv.id}`}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition"
                            >
                              View Bill
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: EXPENSES (MONEY OUT) */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Store & Operational Expenses</h2>
                <p className="text-xs text-white/50">Track business expenses, supplier payments, and receipts</p>
              </div>
              <Link
                href={`/app/${businessSlug}/expenses/new`}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold rounded-xl text-xs transition"
              >
                + Record Expense
              </Link>
            </div>

            <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
              {expenses.length === 0 ? (
                <div className="p-12 text-center text-white/50">No expenses recorded yet.</div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white/50 uppercase bg-black/20">
                      <tr>
                        <th className="px-6 py-4">Expense #</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Supplier</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {expenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-white">
                            <Link href={`/app/${businessSlug}/expenses/${expense.id}`} className="hover:underline">
                              {expense.expense_number}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-white/70" suppressHydrationWarning>
                            {new Date(expense.effective_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-white">{expense.expense_categories?.name || 'General'}</td>
                          <td className="px-6 py-4 text-white/70">{expense.suppliers?.name || '—'}</td>
                          <td className="px-6 py-4 font-bold text-rose-300">
                            {formatMoney(Number(expense.total_minor))}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-md font-semibold capitalize ${
                                expense.payment_status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {expense.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/app/${businessSlug}/expenses/${expense.id}`}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition"
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: RECEIPTS */}
        {activeTab === 'receipts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Customer Payment Receipts</h2>
              <p className="text-xs text-white/50">Proof of customer payments</p>
            </div>

            <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
              {receipts.length === 0 ? (
                <div className="p-12 text-center text-white/50">No receipts issued yet.</div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white/50 uppercase bg-black/20">
                      <tr>
                        <th className="px-6 py-4">Receipt #</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Reference Sale</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {receipts.map((rcpt) => (
                        <tr key={rcpt.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-[#B8F25C]">
                            <Link href={`/app/${businessSlug}/receipts/${rcpt.id}`} className="hover:underline">
                              {rcpt.receipt_number}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-white">
                            {(rcpt.customer_snapshot as any)?.name || 'Walk-in'}
                          </td>
                          <td className="px-6 py-4 text-white/60">{rcpt.sale_number_snapshot}</td>
                          <td className="px-6 py-4 font-bold text-[#B8F25C]">
                            {formatMoney(Number(rcpt.amount_minor))}
                          </td>
                          <td className="px-6 py-4 text-xs text-white/60" suppressHydrationWarning>
                            {new Date(rcpt.payment_occurred_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/app/${businessSlug}/receipts/${rcpt.id}`}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: AI BOOKKEEPER */}
        {activeTab === 'bookkeeper' && (
          <div className="space-y-6">
            <div className="bg-[#143628]/40 border border-[#B8F25C]/20 rounded-3xl p-6 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#B8F25C]" />
                AI Quick Bookkeeper
              </h2>
              <p className="text-sm text-white/60 mt-1">
                Type or paste whatever you sold or spent (e.g., &quot;Sold 3 bags of rice for ₦45,000 cash&quot; or &quot;Paid ₦5,000 for shop generator petrol&quot;). NNOO will suggest the right record for you to confirm.
              </p>
            </div>

            <QuickCaptureForm businessId={businessId} businessSlug={businessSlug} />
            <BookkeeperInbox businessId={businessId} businessSlug={businessSlug} />
          </div>
        )}
      </div>
    </div>
  );
}
