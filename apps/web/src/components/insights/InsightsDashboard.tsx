'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  Calendar,
  Clock,
  History,
  ChevronRight,
  Info,
  DollarSign,
  Package,
  FileText,
  CreditCard,
  Building2,
} from 'lucide-react';
import type {
  BusinessSummaryType,
  VerifiedFactBundle,
  BusinessInsightSignal,
  BusinessInsightActionKey,
  BusinessSummaryDetail,
  BusinessSummaryHistoryItem,
} from '@nnoo/contracts';

export interface InsightsDashboardProps {
  businessSlug: string;
  businessName: string;
  currencyCode: string;
  initialFacts: {
    bundle: VerifiedFactBundle;
    signals: BusinessInsightSignal[];
    allowableActions: BusinessInsightActionKey[];
    latestSummary?: BusinessSummaryDetail | null;
    isFresh: boolean;
  };
  initialHistory: BusinessSummaryHistoryItem[];
}

function formatMoney(amountMinor: number, currency: string = 'NGN'): string {
  const symbol = currency === 'NGN' ? '₦' : `${currency} `;
  const absVal = Math.abs(amountMinor) / 100;
  const formatted = absVal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amountMinor < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function InsightsDashboard({
  businessSlug,
  businessName,
  currencyCode,
  initialFacts,
  initialHistory,
}: InsightsDashboardProps) {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<BusinessSummaryType>(initialFacts.bundle.summaryType);
  const [customStartDate, setCustomStartDate] = useState<string>(initialFacts.bundle.period.start);
  const [customEndDate, setCustomEndDate] = useState<string>(initialFacts.bundle.period.end);

  const [facts, setFacts] = useState(initialFacts);
  const [history, setHistory] = useState(initialHistory);
  const [isLoadingFacts, setIsLoadingFacts] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Switch Period & Fetch Facts
  const handlePeriodChange = async (period: BusinessSummaryType, customStart?: string, customEnd?: string) => {
    setSelectedPeriod(period);
    setErrorMsg(null);
    setIsLoadingFacts(true);

    try {
      const queryParams = new URLSearchParams({
        businessId: businessSlug,
        period,
      });
      if (period === 'custom' && customStart && customEnd) {
        queryParams.append('startDate', customStart);
        queryParams.append('endDate', customEnd);
      }

      const res = await fetch(`/api/v1/ai/insights/facts?${queryParams.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to load business facts');
      }

      setFacts(json.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update facts');
    } finally {
      setIsLoadingFacts(false);
    }
  };

  // Generate or Update AI Summary
  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const idempotencyKey = `summary_${businessSlug}_${selectedPeriod}_${Date.now()}`;
      const res = await fetch(`/api/v1/ai/insights/generate?businessId=${businessSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: businessSlug,
          summaryType: selectedPeriod,
          startDate: selectedPeriod === 'custom' ? customStartDate : undefined,
          endDate: selectedPeriod === 'custom' ? customEndDate : undefined,
          idempotencyKey,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to generate summary narrative');
      }

      // Update local state with fresh summary
      setFacts((prev) => ({
        ...prev,
        latestSummary: json.data,
        isFresh: true,
      }));

      // Refresh history list
      const histRes = await fetch(`/api/v1/ai/insights/summaries?businessId=${businessSlug}&limit=10`);
      const histJson = await histRes.json();
      if (histJson.success) {
        setHistory(histJson.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const bundle = facts.bundle;
  const perf = bundle.performance;
  const pos = bundle.currentPosition;
  const summary = facts.latestSummary;
  const highlightSignals = facts.signals.filter((s) => s.type === 'performance');
  const attentionSignals = facts.signals.filter((s) => s.type === 'attention' || (s.type === 'position' && s.direction === 'UP'));

  return (
    <div className="min-h-screen bg-[#07130F] text-white p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#B8F25C] uppercase mb-1">
              <Sparkles className="w-4 h-4" />
              <span>NNOO Smart Intelligence</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              Business Insights
              <span className="text-xs bg-[#B8F25C]/15 text-[#B8F25C] px-3 py-1 rounded-full border border-[#B8F25C]/30 font-medium">
                Verified Truth
              </span>
            </h1>
            <p className="text-sm text-white/60 mt-1">
              Deterministic operational numbers from your NNOO business records explained in plain English.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-xl border border-white/10 flex items-center gap-2 transition"
            >
              <History className="w-4 h-4 text-white/70" />
              Summary History
            </button>
            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating || isLoadingFacts}
              className="px-5 py-2 bg-[#B8F25C] hover:bg-[#a6e048] disabled:opacity-50 text-[#0A1C16] text-xs font-bold rounded-xl shadow-lg shadow-[#B8F25C]/15 flex items-center gap-2 transition"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Narrative...
                </>
              ) : summary && facts.isFresh ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Update Summary
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Summary
                </>
              )}
            </button>
          </div>
        </div>

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <div className="font-semibold">Operation Notice</div>
              <div>{errorMsg}</div>
            </div>
          </div>
        )}

        {/* PERIOD SELECTOR TABS */}
        <div className="bg-[#0A1C16]/80 border border-white/10 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['today', 'this_week', 'this_month', 'custom'] as BusinessSummaryType[]).map((periodKey) => {
              const labelMap: Record<BusinessSummaryType, string> = {
                today: 'Today',
                this_week: 'This Week',
                this_month: 'This Month',
                custom: 'Custom Range',
              };
              const isSelected = selectedPeriod === periodKey;
              return (
                <button
                  key={periodKey}
                  onClick={() => {
                    if (periodKey !== 'custom') {
                      handlePeriodChange(periodKey);
                    } else {
                      setSelectedPeriod('custom');
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#B8F25C] text-[#0A1C16] shadow-md shadow-[#B8F25C]/10'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {labelMap[periodKey]}
                </button>
              );
            })}
          </div>

          {selectedPeriod === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-black/30 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#B8F25C]"
              />
              <span className="text-white/40 text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-black/30 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#B8F25C]"
              />
              <button
                onClick={() => handlePeriodChange('custom', customStartDate, customEndDate)}
                className="px-3 py-1.5 bg-[#B8F25C]/20 hover:bg-[#B8F25C]/30 text-[#B8F25C] border border-[#B8F25C]/30 rounded-xl text-xs font-semibold transition"
              >
                Apply Range
              </button>
            </div>
          )}

          <div className="text-xs text-white/60 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#B8F25C]" />
            <span>
              Period: <strong className="text-white font-medium">{bundle.period.label}</strong>
            </span>
          </div>
        </div>

        {/* AI SUMMARY NARRATIVE CARD */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0D241C] via-[#0A1C16] to-[#07130F] border border-[#B8F25C]/20 p-6 lg:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8F25C]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#B8F25C]/15 border border-[#B8F25C]/30 flex items-center justify-center text-[#B8F25C]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {summary ? summary.headline : 'NNOO Executive Summary'}
                  </h2>
                  <div className="text-xs text-white/50 flex items-center gap-2">
                    <span>Generated via NNOO AI</span>
                    <span>•</span>
                    <span>
                      {summary
                        ? `As of ${new Date(summary.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Awaiting generation'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {summary && facts.isFresh ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#B8F25C]/15 text-[#B8F25C] border border-[#B8F25C]/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Fresh with current data
                  </span>
                ) : summary && !facts.isFresh ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Data changed since last summary
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60 border border-white/10">
                    <Info className="w-3.5 h-3.5" />
                    Click Generate to produce narrative
                  </span>
                )}
              </div>
            </div>

            {/* NARRATIVE TEXT */}
            <div className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
              {summary ? (
                summary.overview
              ) : (
                <div className="p-6 text-center text-white/50 space-y-2">
                  <p>No written narrative has been generated for this period yet.</p>
                  <p className="text-xs">
                    Your verified business numbers are ready below. Click{' '}
                    <strong className="text-[#B8F25C]">Generate Summary</strong> above to produce a plain-English
                    explanation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* VERIFIED PERFORMANCE METRICS (PERIOD METRICS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#B8F25C]" />
              Period Performance
              <span className="text-xs text-white/40 font-normal">({bundle.period.label})</span>
            </h2>
            <span className="text-xs text-[#B8F25C] bg-[#B8F25C]/10 px-2.5 py-1 rounded-lg border border-[#B8F25C]/20">
              Source: NNOO Financial Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* NET SALES */}
            <div className="bg-[#0A1C16] border border-white/10 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="text-xs text-white/60 font-medium">Net Sales</div>
              <div className="text-2xl font-bold text-white">{formatMoney(perf.netSalesMinor, currencyCode)}</div>
              <div className="text-xs flex items-center gap-1.5 text-white/60">
                <span>{perf.salesCount} sales recorded</span>
                {perf.refundsMinor > 0 && (
                  <span className="text-amber-300">({formatMoney(perf.refundsMinor, currencyCode)} refunded)</span>
                )}
              </div>
            </div>

            {/* GROSS PROFIT */}
            <div className="bg-[#0A1C16] border border-white/10 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="text-xs text-white/60 font-medium">Gross Profit</div>
              <div className="text-2xl font-bold text-white">{formatMoney(perf.grossProfitMinor, currencyCode)}</div>
              <div className="text-xs text-white/60">
                COGS: {formatMoney(perf.cogsMinor, currencyCode)}
              </div>
            </div>

            {/* OPERATING EXPENSES */}
            <div className="bg-[#0A1C16] border border-white/10 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="text-xs text-white/60 font-medium">Operating Expenses</div>
              <div className="text-2xl font-bold text-white">
                {formatMoney(perf.operatingExpensesMinor, currencyCode)}
              </div>
              <div className="text-xs text-white/60">Shop rent, utilities, fuel & running costs</div>
            </div>

            {/* OPERATING RESULT */}
            <div className="bg-[#0A1C16] border border-white/10 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="text-xs text-white/60 font-medium">Operating Result</div>
              <div
                className={`text-2xl font-bold ${
                  perf.operatingResultMinor >= 0 ? 'text-[#B8F25C]' : 'text-red-400'
                }`}
              >
                {formatMoney(perf.operatingResultMinor, currencyCode)}
              </div>
              <div className="text-xs text-white/60">Gross profit less operating expenditures</div>
            </div>
          </div>
        </div>

        {/* CURRENT POSITION METRICS (AS OF TIMESTAMP) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#B8F25C]" />
              Current Balance & Position
              <span className="text-xs text-white/40 font-normal" suppressHydrationWarning>
                (As of {new Date(pos.asOfTimestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })})
              </span>
            </h2>
            <span className="text-xs text-white/50">Point-in-Time Balances</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ACCOUNTS RECEIVABLE */}
            <div className="bg-[#0A1C16] border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60 font-medium">Money Customers Owe (AR)</span>
                <Link
                  href={`/app/${businessSlug}/reports/receivables`}
                  className="text-xs text-[#B8F25C] hover:underline flex items-center gap-1"
                >
                  View AR <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="text-xl font-bold text-white">
                {formatMoney(pos.accountsReceivableMinor, currencyCode)}
              </div>
              <p className="text-xs text-white/50">Outstanding customer balances from credit sales and invoices</p>
            </div>

            {/* ACCOUNTS PAYABLE */}
            <div className="bg-[#0A1C16] border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60 font-medium">Money Owed to Suppliers (AP)</span>
                <Link
                  href={`/app/${businessSlug}/reports/payables`}
                  className="text-xs text-[#B8F25C] hover:underline flex items-center gap-1"
                >
                  View AP <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="text-xl font-bold text-white">
                {formatMoney(pos.accountsPayableMinor, currencyCode)}
              </div>
              <p className="text-xs text-white/50">Outstanding payables for stock receipts and unpaid expenses</p>
            </div>

            {/* INVENTORY VALUATION */}
            <div className="bg-[#0A1C16] border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60 font-medium">Total Inventory Valuation</span>
                <Link
                  href={`/app/${businessSlug}/reports/inventory`}
                  className="text-xs text-[#B8F25C] hover:underline flex items-center gap-1"
                >
                  View Stock <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="text-xl font-bold text-white">
                {formatMoney(pos.inventoryValueMinor, currencyCode)}
              </div>
              <p className="text-xs text-white/50">Current calculated valuation of on-hand catalog stock</p>
            </div>
          </div>
        </div>

        {/* TWO COLUMN GRID: KEY SIGNALS & NEEDS ATTENTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* KEY SIGNALS */}
          <div className="bg-[#0A1C16] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <TrendingUp className="w-4 h-4 text-[#B8F25C]" />
              Key Changes & Shift Signals
            </h3>

            <div className="space-y-3">
              {highlightSignals.length === 0 ? (
                <p className="text-xs text-white/50 py-4 text-center">No notable shift signals detected.</p>
              ) : (
                highlightSignals.map((sig) => (
                  <div
                    key={sig.signalKey}
                    className="p-3.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        {sig.title}
                        {sig.direction === 'UP' && (
                          <span className="inline-flex items-center text-[10px] text-[#B8F25C] bg-[#B8F25C]/15 px-2 py-0.5 rounded-full font-medium">
                            <ArrowUpRight className="w-3 h-3" /> UP
                          </span>
                        )}
                        {sig.direction === 'DOWN' && (
                          <span className="inline-flex items-center text-[10px] text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full font-medium">
                            <ArrowDownRight className="w-3 h-3" /> DOWN
                          </span>
                        )}
                        {sig.direction === 'UNCHANGED' && (
                          <span className="inline-flex items-center text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full font-medium">
                            <Minus className="w-3 h-3" /> STABLE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/60">{sig.changeDescription}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-white">{sig.formattedMetric}</div>
                      {sig.actionKey && (
                        <Link
                          href={`/app/${businessSlug}/reports/sales`}
                          className="text-[11px] text-[#B8F25C] hover:underline"
                        >
                          Details
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* NEEDS ATTENTION */}
          <div className="bg-[#0A1C16] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Operational Areas Needing Attention
            </h3>

            <div className="space-y-3">
              {pos.overdueInvoicesCount > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {pos.overdueInvoicesCount} Overdue Invoices
                    </div>
                    <div className="text-xs text-white/60">Issued customer invoices past their due dates</div>
                  </div>
                  <Link
                    href={`/app/${businessSlug}/invoices`}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 transition"
                  >
                    Review
                  </Link>
                </div>
              )}

              {pos.lowStockCount > 0 && (
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-amber-300" />
                      {pos.lowStockCount} Low Stock Products
                    </div>
                    <div className="text-xs text-white/60">Inventory items running at or below safety threshold</div>
                  </div>
                  <Link
                    href={`/app/${businessSlug}/inventory`}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/15 transition"
                  >
                    Restock
                  </Link>
                </div>
              )}

              {pos.outOfStockCount > 0 && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-red-300 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      {pos.outOfStockCount} Out of Stock Products
                    </div>
                    <div className="text-xs text-white/60">Products with zero quantity on hand</div>
                  </div>
                  <Link
                    href={`/app/${businessSlug}/inventory`}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold rounded-lg border border-red-500/30 transition"
                  >
                    Restock
                  </Link>
                </div>
              )}

              {pos.overdueInvoicesCount === 0 && pos.lowStockCount === 0 && pos.outOfStockCount === 0 && (
                <div className="p-6 text-center text-white/50 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-[#B8F25C] mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-medium text-white">No Urgent Attention Items</p>
                  <p className="text-[11px]">All invoices are up to date and stock thresholds are healthy.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RECOMMENDED ACTIONS */}
        <div className="bg-[#0A1C16] border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <ChevronRight className="w-4 h-4 text-[#B8F25C]" />
            What to Review Next
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              href={`/app/${businessSlug}/reports/sales`}
              className="p-3.5 rounded-xl bg-black/20 hover:bg-black/40 border border-white/10 hover:border-[#B8F25C]/40 text-center transition group"
            >
              <DollarSign className="w-5 h-5 text-[#B8F25C] mx-auto mb-2 group-hover:scale-110 transition" />
              <div className="text-xs font-semibold text-white">Sales Report</div>
            </Link>

            <Link
              href={`/app/${businessSlug}/reports/expenses`}
              className="p-3.5 rounded-xl bg-black/20 hover:bg-black/40 border border-white/10 hover:border-[#B8F25C]/40 text-center transition group"
            >
              <CreditCard className="w-5 h-5 text-amber-300 mx-auto mb-2 group-hover:scale-110 transition" />
              <div className="text-xs font-semibold text-white">Expenses</div>
            </Link>

            <Link
              href={`/app/${businessSlug}/reports/profitability`}
              className="p-3.5 rounded-xl bg-black/20 hover:bg-black/40 border border-white/10 hover:border-[#B8F25C]/40 text-center transition group"
            >
              <TrendingUp className="w-5 h-5 text-[#B8F25C] mx-auto mb-2 group-hover:scale-110 transition" />
              <div className="text-xs font-semibold text-white">Profitability</div>
            </Link>

            <Link
              href={`/app/${businessSlug}/reports/receivables`}
              className="p-3.5 rounded-xl bg-black/20 hover:bg-black/40 border border-white/10 hover:border-[#B8F25C]/40 text-center transition group"
            >
              <FileText className="w-5 h-5 text-sky-300 mx-auto mb-2 group-hover:scale-110 transition" />
              <div className="text-xs font-semibold text-white">Receivables</div>
            </Link>

            <Link
              href={`/app/${businessSlug}/reports/payables`}
              className="p-3.5 rounded-xl bg-black/20 hover:bg-black/40 border border-white/10 hover:border-[#B8F25C]/40 text-center transition group"
            >
              <Building2 className="w-5 h-5 text-purple-300 mx-auto mb-2 group-hover:scale-110 transition" />
              <div className="text-xs font-semibold text-white">Payables</div>
            </Link>

            <Link
              href={`/app/${businessSlug}/inventory`}
              className="p-3.5 rounded-xl bg-black/20 hover:bg-black/40 border border-white/10 hover:border-[#B8F25C]/40 text-center transition group"
            >
              <Package className="w-5 h-5 text-emerald-300 mx-auto mb-2 group-hover:scale-110 transition" />
              <div className="text-xs font-semibold text-white">Inventory</div>
            </Link>
          </div>
        </div>

        {/* HISTORY MODAL / DRAWER */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0A1C16] border border-white/15 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#B8F25C]" />
                  <h3 className="text-lg font-bold text-white">Summary Generation History</h3>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-white/60 hover:text-white text-xs font-semibold px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <p className="text-xs text-white/50 text-center py-6">No historical summaries recorded yet.</p>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#B8F25C] uppercase tracking-wider">
                          {item.summaryType} ({item.periodStart} to {item.periodEnd})
                        </span>
                        <span className="text-[11px] text-white/40" suppressHydrationWarning>
                          {new Date(item.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-white">{item.headline}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
