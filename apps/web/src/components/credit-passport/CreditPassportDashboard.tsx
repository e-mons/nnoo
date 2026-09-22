'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileBadge,
  Download,
  Share2,
  History,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  FileText,
  Activity,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react';
import type {
  CreditPassportPreview,
  CreditPassportSnapshot,
  CreditPassportShare,
  CreditPassportExplanation,
} from '@nnoo/contracts';

interface CreditPassportDashboardProps {
  businessId: string;
  businessSlug: string;
  userRole: string;
}

export function CreditPassportDashboard({
  businessId,
  businessSlug,
  userRole,
}: CreditPassportDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preview, setPreview] = useState<CreditPassportPreview | null>(null);
  const [activeSnapshot, setActiveSnapshot] = useState<CreditPassportSnapshot | null>(null);

  // Modals / Drawers
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState<CreditPassportSnapshot[]>([]);
  const [activeShares, setActiveShares] = useState<CreditPassportShare[]>([]);

  // Share Form state
  const [shareExpiryDays, setShareExpiryDays] = useState(7);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const canShare = ['owner', 'business_admin'].includes(userRole);

  const fetchPreview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/ai/credit-passport/preview?businessId=${businessId}`);
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to load Credit Passport preview.');
      }
      setPreview(json.data);
      if (json.data.latestSnapshot) {
        setActiveSnapshot(json.data.latestSnapshot);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      const res = await fetch(`/api/v1/ai/credit-passport/generate?businessId=${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to generate Credit Passport.');
      }
      setActiveSnapshot(json.data);
      await fetchPreview();
    } catch (err: any) {
      setError(err.message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExplain = async () => {
    if (!activeSnapshot) return;
    try {
      setExplaining(true);
      setError(null);
      const res = await fetch(`/api/v1/ai/credit-passport/explain?businessId=${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId: activeSnapshot.id }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to generate AI summary.');
      }
      setActiveSnapshot({
        ...activeSnapshot,
        aiExplanation: json.data,
      });
    } catch (err: any) {
      setError(err.message || 'AI explanation failed.');
    } finally {
      setExplaining(false);
    }
  };

  const handleCreateShare = async () => {
    if (!activeSnapshot) return;
    try {
      setShareLoading(true);
      const res = await fetch(`/api/v1/ai/credit-passport/shares?businessId=${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotId: activeSnapshot.id,
          expiresInDays: shareExpiryDays,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to create share link.');
      }
      setGeneratedShareUrl(json.data.shareUrl);
      fetchShares();
    } catch (err: any) {
      setError(err.message || 'Failed to create share link.');
    } finally {
      setShareLoading(false);
    }
  };

  const fetchShares = async () => {
    if (!activeSnapshot) return;
    try {
      const res = await fetch(`/api/v1/ai/credit-passport/shares?businessId=${businessId}&snapshotId=${activeSnapshot.id}`);
      const json = await res.json();
      if (json.success) {
        setActiveShares(json.data);
      }
    } catch {
      // silent
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      const res = await fetch(`/api/v1/ai/credit-passport/shares/${shareId}?businessId=${businessId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        fetchShares();
      }
    } catch {
      // silent
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/v1/ai/credit-passport/history?businessId=${businessId}`);
      const json = await res.json();
      if (json.success) {
        setHistoryList(json.data.snapshots);
      }
    } catch {
      // silent
    }
  };

  const handleCopyLink = () => {
    if (!generatedShareUrl) return;
    navigator.clipboard.writeText(generatedShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (minor: number | string | null | undefined, curr: string = 'NGN') => {
    const num = typeof minor === 'string' ? parseFloat(minor) : Number(minor);
    const safeMinor = isNaN(num) || !isFinite(num) ? 0 : num;
    const major = safeMinor / 100;
    return `${curr} ${major.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#B8F25C] animate-spin" />
          <p className="text-white/60 text-sm">Loading Credit Passport facts...</p>
        </div>
      </div>
    );
  }

  if (error && !preview) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <h3 className="text-white font-medium">Unable to load Credit Passport</h3>
        <p className="text-white/60 text-sm mt-1">{error}</p>
        <button
          onClick={fetchPreview}
          className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const payload = activeSnapshot ? activeSnapshot.payload : preview?.payload;
  if (!payload) return null;

  const {
    businessIdentity,
    financialPerformance,
    currentPosition,
    invoiceActivity,
    inventoryPosition,
    healthScore,
    recordedHistory,
    dataCoverage,
  } = payload;
  const currency = businessIdentity.currencyCode || 'NGN';

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#0A1C16] border border-white/10 rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-[#B8F25C]/10 text-[#B8F25C] rounded-xl border border-[#B8F25C]/20">
                <FileBadge className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">NNOO Credit Passport</h1>
                <p className="text-sm text-white/60">
                  Portable, record-backed business profile and verified operational history.
                </p>
              </div>
            </div>

            {/* Passport Identity & Version Badges */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {activeSnapshot ? (
                <>
                  <span className="px-3 py-1 bg-white/10 text-white font-mono text-sm font-semibold rounded-lg border border-white/10">
                    {activeSnapshot.passportCode}
                  </span>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/20">
                    Version {activeSnapshot.passportVersion}
                  </span>
                  <span className="text-xs text-white/40" suppressHydrationWarning>
                    Generated: {new Date(activeSnapshot.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </>
              ) : (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/20">
                  Live Preview (Not yet generated)
                </span>
              )}

              <span className="px-3 py-1 bg-sky-500/10 text-sky-400 text-xs font-semibold rounded-lg border border-sky-500/20">
                Coverage: {dataCoverage.level.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#B8F25C] hover:bg-[#a6db4f] text-[#0A1C16] font-semibold text-sm rounded-xl transition shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              {activeSnapshot ? 'Generate New Version' : 'Generate Passport'}
            </button>

            {activeSnapshot && (
              <>
                <a
                  href={`/api/v1/ai/credit-passport/snapshots/${activeSnapshot.id}/pdf?businessId=${businessId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-xl transition border border-white/10"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>

                {canShare && (
                  <button
                    onClick={() => {
                      fetchShares();
                      setShowShareModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-xl transition border border-white/10"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Securely
                  </button>
                )}

                <button
                  onClick={() => {
                    fetchHistory();
                    setShowHistoryModal(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm rounded-xl transition border border-white/10"
                >
                  <History className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stale records alert */}
        {preview?.isStale && activeSnapshot && (
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-200">
                Your business records have changed since Version {activeSnapshot.passportVersion} was generated.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg transition"
            >
              Update Passport
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Business Profile & Operating History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Identity */}
        <div className="bg-[#0A1C16]/80 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Building2 className="w-4 h-4 text-[#B8F25C]" />
              <h3>Business Identity</h3>
            </div>
            <span className="text-[10px] text-white/40 italic">Source: Business Profile</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Business Name</span>
              <span className="text-white font-medium">{businessIdentity.name}</span>
            </div>
            {businessIdentity.legalName && (
              <div className="flex justify-between">
                <span className="text-white/50">Legal Name</span>
                <span className="text-white font-medium">{businessIdentity.legalName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/50">Industry</span>
              <span className="text-white font-medium">{businessIdentity.industry || 'General Trade'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Location</span>
              <span className="text-white font-medium">
                {[businessIdentity.city, businessIdentity.state, businessIdentity.countryCode].filter(Boolean).join(', ')}
              </span>
            </div>
            {businessIdentity.registrationNumber && (
              <div className="flex justify-between">
                <span className="text-white/50">Registration No.</span>
                <span className="text-white font-mono">{businessIdentity.registrationNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Recorded Operating History */}
        <div className="bg-[#0A1C16]/80 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Calendar className="w-4 h-4 text-[#B8F25C]" />
              <h3>Recorded Operating History</h3>
            </div>
            <span className="text-[10px] text-white/40 italic">Source: NNOO Operational Records</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">First Recorded Activity</span>
              <span className="text-white font-medium">{recordedHistory.firstRecordedDate || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Evaluation Window</span>
              <span className="text-white font-medium">Last 90 Days ({financialPerformance.periodStart} to {financialPerformance.periodEnd})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Total Operating History</span>
              <span className="text-white font-medium">{recordedHistory.recordedDaysCount} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Data Coverage</span>
              <span className="text-emerald-400 font-semibold">{dataCoverage.level.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Performance & Current Position */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 90-Day Financial Activity */}
        <div className="bg-[#0A1C16]/80 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <DollarSign className="w-4 h-4 text-[#B8F25C]" />
              <h3>Financial Performance (90 Days)</h3>
            </div>
            <span className="text-[10px] text-white/40 italic">Source: NNOO Financial Calculations</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Net Sales</span>
              <span className="text-white font-bold">{formatCurrency(financialPerformance.netSalesMinor, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Gross Profit</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(financialPerformance.grossProfitMinor, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Operating Expenses</span>
              <span className="text-white font-medium">{formatCurrency(financialPerformance.operatingExpensesMinor, currency)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2">
              <span className="text-white/50">Operating Result</span>
              <span className={`font-bold ${financialPerformance.operatingResultMinor >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(financialPerformance.operatingResultMinor, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Current Position */}
        <div className="bg-[#0A1C16]/80 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <TrendingUp className="w-4 h-4 text-[#B8F25C]" />
              <h3>Current Position</h3>
            </div>
            <span className="text-[10px] text-white/40 italic" suppressHydrationWarning>
              Source: NNOO Operational Records (As of {new Date(currentPosition.asOf).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })})
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Accounts Receivable (Customers Owe)</span>
              <span className="text-white font-medium">{formatCurrency(currentPosition.accountsReceivableMinor, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Accounts Payable (Business Owes)</span>
              <span className="text-white font-medium">{formatCurrency(currentPosition.accountsPayableMinor, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Inventory Valuation</span>
              <span className="text-white font-medium">
                {inventoryPosition.isApplicable && inventoryPosition.inventoryValueMinor !== null
                  ? formatCurrency(inventoryPosition.inventoryValueMinor, currency)
                  : 'Service Business (N/A)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Overdue Invoices</span>
              <span className="text-white font-medium">{currentPosition.overdueInvoicesCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Activity, Inventory Readiness & Health Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Invoice Operations */}
        <div className="bg-[#0A1C16]/80 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <FileText className="w-4 h-4 text-[#B8F25C]" />
              <h3>Invoice Activity</h3>
            </div>
            <span className="text-[10px] text-white/40 italic">Source: NNOO</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Total Invoices</span>
              <span className="text-white font-medium">{invoiceActivity.totalInvoicesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Paid Invoices</span>
              <span className="text-emerald-400 font-medium">{invoiceActivity.paidInvoicesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Pending Invoices</span>
              <span className="text-amber-300 font-medium">{invoiceActivity.pendingInvoicesCount}</span>
            </div>
          </div>
        </div>

        {/* Inventory Position */}
        <div className="bg-[#0A1C16]/80 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Package className="w-4 h-4 text-[#B8F25C]" />
              <h3>Inventory Readiness</h3>
            </div>
            <span className="text-[10px] text-white/40 italic">Source: NNOO</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Tracked Products</span>
              <span className="text-white font-medium">{inventoryPosition.isApplicable ? inventoryPosition.trackedItemsCount : 'Service Business (N/A)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Low Stock Items</span>
              <span className="text-amber-300 font-medium">{inventoryPosition.lowStockCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Out of Stock Items</span>
              <span className="text-rose-400 font-medium">{inventoryPosition.outOfStockCount}</span>
            </div>
          </div>
        </div>

        {/* Business Health Score */}
        <div className="bg-[#0A1C16]/80 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Activity className="w-4 h-4 text-[#B8F25C]" />
              <h3>Business Health</h3>
            </div>
            <span className="text-[10px] text-white/40 italic">Source: Health Score v1</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-2xl font-bold text-[#B8F25C]">
              {healthScore.score !== null ? `${healthScore.score} / 100` : 'INSUFFICIENT DATA'}
            </span>
            {healthScore.scoreBand && (
              <span className="text-xs font-semibold text-sky-400 mt-1 uppercase">
                {healthScore.scoreBand}
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/40 text-center mt-2">
            Operational indicator only. Not a credit score.
          </p>
        </div>
      </div>

      {/* Optional AI Explanation Summary */}
      <div className="bg-[#0A1C16]/80 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Sparkles className="w-4 h-4 text-[#B8F25C]" />
            <h3>NNOO AI Passport Summary</h3>
          </div>
          {activeSnapshot && !activeSnapshot.aiExplanation && (
            <button
              onClick={handleExplain}
              disabled={explaining}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#B8F25C]/10 hover:bg-[#B8F25C]/20 text-[#B8F25C] text-xs font-semibold rounded-lg transition border border-[#B8F25C]/20 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${explaining ? 'animate-spin' : ''}`} />
              {explaining ? 'Generating Summary...' : 'Generate AI Summary'}
            </button>
          )}
        </div>

        {activeSnapshot?.aiExplanation ? (
          <div className="space-y-4">
            <h4 className="text-base font-bold text-white">{activeSnapshot.aiExplanation.headline}</h4>
            <p className="text-sm text-white/70 leading-relaxed">{activeSnapshot.aiExplanation.overview}</p>

            {activeSnapshot.aiExplanation.highlightKeys?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {activeSnapshot.aiExplanation.highlightKeys.map((key) => (
                  <span
                    key={key}
                    className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-medium rounded-md border border-emerald-500/20"
                  >
                    ✓ {key.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-white/50 italic">
            Generate an AI Passport Summary to produce a grounded natural language narrative for financial partners.
          </p>
        )}
      </div>

      {/* Disclaimers & Non-Credit Boundary */}
      <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <div className="flex items-center gap-2 text-amber-400 font-semibold mb-2 text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>IMPORTANT NOTICE & REGULATORY DISCLAIMER</span>
        </div>
        <ul className="space-y-1 text-xs text-amber-200/80 list-disc list-inside">
          <li>
            This Credit Passport reflects Business information recorded in NNOO as of the stated generation timestamp. It is not an independent audit.
          </li>
          <li>
            The Credit Passport is an operational Business profile and does not constitute a Credit Score, credit bureau rating, loan approval, or lending guarantee.
          </li>
          <li>
            Business Profile information was provided by the Business. Operational and financial figures are derived from records maintained in NNOO.
          </li>
        </ul>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A1C16] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">Share Credit Passport</h3>
              <p className="text-xs text-white/60 mt-1">
                Create a secure, read-only link for Version {activeSnapshot?.passportVersion}. No account access or private customer PII is shared.
              </p>
            </div>

            {/* Expiration selection */}
            <div className="space-y-2">
              <label className="text-xs text-white/60">Link Expiration</label>
              <select
                value={shareExpiryDays}
                onChange={(e) => setShareExpiryDays(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B8F25C]"
              >
                <option value={1}>1 Day</option>
                <option value={7}>7 Days (Recommended)</option>
                <option value={30}>30 Days (Maximum)</option>
              </select>
            </div>

            <button
              onClick={handleCreateShare}
              disabled={shareLoading}
              className="w-full py-2.5 bg-[#B8F25C] hover:bg-[#a6db4f] text-[#0A1C16] font-semibold text-sm rounded-xl transition disabled:opacity-50"
            >
              {shareLoading ? 'Generating Link...' : 'Create Secure Link'}
            </button>

            {generatedShareUrl && (
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <p className="text-xs text-white/50">Active Share URL:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedShareUrl}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 bg-[#B8F25C] text-[#0A1C16] rounded-lg text-xs font-semibold hover:bg-[#a6db4f] transition flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {/* Active Shares List */}
            {activeShares.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h4 className="text-xs font-semibold text-white/70">Active Shares for this Version</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {activeShares.map((share) => (
                    <div
                      key={share.id}
                      className="p-2.5 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="text-white/80" suppressHydrationWarning>Expires: {new Date(share.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        {share.isRevoked && <span className="ml-2 text-rose-400 font-semibold">[Revoked]</span>}
                        {share.isExpired && !share.isRevoked && <span className="ml-2 text-amber-400 font-semibold">[Expired]</span>}
                      </div>
                      {!share.isRevoked && !share.isExpired && (
                        <button
                          onClick={() => handleRevokeShare(share.id)}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded transition"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A1C16] border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">Passport Version History</h3>
              <p className="text-xs text-white/60 mt-1">
                Immutable historical Credit Passport snapshots generated for this business.
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {historyList.map((snap) => (
                <div
                  key={snap.id}
                  className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">Version {snap.passportVersion}</span>
                      <span className="text-xs text-white/40 font-mono">({snap.passportCode})</span>
                    </div>
                    <p className="text-xs text-white/50 mt-1" suppressHydrationWarning>
                      Generated {new Date(snap.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })} • Period: {snap.periodStart} to {snap.periodEnd}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveSnapshot(snap);
                        setShowHistoryModal(false);
                      }}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
                    >
                      View
                    </button>
                    <a
                      href={`/api/v1/ai/credit-passport/snapshots/${snap.id}/pdf?businessId=${businessId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#B8F25C]/10 text-[#B8F25C] hover:bg-[#B8F25C]/20 text-xs font-semibold rounded-lg transition border border-[#B8F25C]/20"
                    >
                      PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
