import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BusinessCreditPassportService } from '@/server/ai';
import {
  FileBadge,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  FileText,
  Activity,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicCreditPassportSharePage({ params }: SharePageProps) {
  const { token } = await params;
  const supabase = await createClient();

  let projection;
  try {
    projection = await BusinessCreditPassportService.getExternalShare({
      supabase,
      token,
    });
  } catch (err: any) {
    if (err?.code === 'CREDIT_PASSPORT_SHARE_EXPIRED' || err?.code === 'CREDIT_PASSPORT_SHARE_REVOKED') {
      return (
        <div className="min-h-screen bg-[#06120E] text-white flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full p-8 bg-[#0A1C16] border border-white/10 rounded-2xl text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white">Credit Passport Unavailable</h1>
            <p className="text-sm text-white/60">
              {err.message || 'This secure Credit Passport link has expired or has been revoked by the business.'}
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
            >
              Return to NNOO Home
            </Link>
          </div>
        </div>
      );
    }
    notFound();
  }

  const {
    passportCode,
    passportVersion,
    generatedAt,
    asOf,
    status,
    artifactHash,
    businessIdentity,
    recordedHistory,
    financialPerformance,
    currentPosition,
    invoiceActivity,
    inventoryPosition,
    healthScore,
    dataCoverage,
    aiExplanation,
  } = projection;

  const currency = businessIdentity.currencyCode || 'NGN';
  const formatCurrency = (minor: number | string | null | undefined) => {
    const num = typeof minor === 'string' ? parseFloat(minor) : Number(minor);
    const safeMinor = isNaN(num) || !isFinite(num) ? 0 : num;
    const major = safeMinor / 100;
    return `${currency} ${major.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-[#06120E] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation & Brand Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-dark-horizontal.png"
              alt="NNOO Logo"
              width={110}
              height={28}
              className="object-contain"
              style={{ width: 'auto', height: 'auto' }}
            />
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified NNOO Snapshot
            </span>
          </div>
        </div>

        {/* Passport Title Card */}
        <div className="bg-[#0A1C16] border border-white/10 rounded-2xl p-6 lg:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#B8F25C] tracking-wider uppercase">
                Portable Business Profile
              </span>
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                {businessIdentity.name}
              </h1>
              <p className="text-sm text-white/60">
                Operating in {businessIdentity.industry || 'General Industry'} • {[businessIdentity.city, businessIdentity.state, businessIdentity.countryCode].filter(Boolean).join(', ')}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1">
              <span className="text-sm font-mono font-bold text-[#B8F25C] bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                {passportCode}
              </span>
              <span className="text-xs text-white/50">
                Version {passportVersion} • Generated {new Date(generatedAt).toLocaleDateString()}
              </span>
              <span className="text-[10px] text-white/30 font-mono">
                Hash: {artifactHash.slice(0, 16)}...
              </span>
            </div>
          </div>
        </div>

        {/* Grid 1: Business Identity & Recorded History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity */}
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
                <span className="text-white/50">Trading Name</span>
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
                <span className="text-white font-medium">{businessIdentity.industry}</span>
              </div>
              {businessIdentity.registrationNumber && (
                <div className="flex justify-between">
                  <span className="text-white/50">Registration No.</span>
                  <span className="text-white font-mono">{businessIdentity.registrationNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div className="bg-[#0A1C16]/80 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Calendar className="w-4 h-4 text-[#B8F25C]" />
                <h3>Recorded History</h3>
              </div>
              <span className="text-[10px] text-white/40 italic">Source: NNOO Records</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">First Recorded Activity</span>
                <span className="text-white font-medium">{recordedHistory.firstRecordedDate || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Evaluation Window</span>
                <span className="text-white font-medium">{financialPerformance.periodStart} to {financialPerformance.periodEnd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Total History</span>
                <span className="text-white font-medium">{recordedHistory.recordedDaysCount} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Data Coverage</span>
                <span className="text-emerald-400 font-semibold">{dataCoverage.level.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid 2: Financial Performance & Current Position */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0A1C16]/80 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-white font-semibold">
                <DollarSign className="w-4 h-4 text-[#B8F25C]" />
                <h3>Financial Performance (90 Days)</h3>
              </div>
              <span className="text-[10px] text-white/40 italic">Source: NNOO Calculations</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Net Sales</span>
                <span className="text-white font-bold">{formatCurrency(financialPerformance.netSalesMinor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Gross Profit</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(financialPerformance.grossProfitMinor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Operating Expenses</span>
                <span className="text-white font-medium">{formatCurrency(financialPerformance.operatingExpensesMinor)}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-white/50">Operating Result</span>
                <span className={`font-bold ${financialPerformance.operatingResultMinor >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(financialPerformance.operatingResultMinor)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#0A1C16]/80 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-white font-semibold">
                <TrendingUp className="w-4 h-4 text-[#B8F25C]" />
                <h3>Current Position</h3>
              </div>
              <span className="text-[10px] text-white/40 italic">As of {new Date(currentPosition.asOf).toLocaleDateString()}</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Accounts Receivable (Owed to Business)</span>
                <span className="text-white font-medium">{formatCurrency(currentPosition.accountsReceivableMinor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Accounts Payable (Owed by Business)</span>
                <span className="text-white font-medium">{formatCurrency(currentPosition.accountsPayableMinor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Inventory Value</span>
                <span className="text-white font-medium">
                  {inventoryPosition.isApplicable && inventoryPosition.inventoryValueMinor !== null
                    ? formatCurrency(inventoryPosition.inventoryValueMinor)
                    : 'Not Applicable'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Overdue Invoices</span>
                <span className="text-white font-medium">{currentPosition.overdueInvoicesCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid 3: Invoice & Health Score */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="bg-[#0A1C16]/80 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Activity className="w-4 h-4 text-[#B8F25C]" />
                <h3>NNOO Business Health Score</h3>
              </div>
              <span className="text-[10px] text-white/40 italic">Formula: {healthScore.formulaVersion}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
              <div>
                <span className="text-2xl font-bold text-[#B8F25C]">
                  {healthScore.score !== null ? `${healthScore.score} / 100` : 'INSUFFICIENT DATA'}
                </span>
                {healthScore.scoreBand && (
                  <p className="text-xs font-semibold text-sky-400 uppercase mt-0.5">
                    {healthScore.scoreBand}
                  </p>
                )}
              </div>
              <p className="text-[10px] text-white/40 max-w-[200px] text-right">
                Internal operational indicator. Not a bank or credit score.
              </p>
            </div>
          </div>
        </div>

        {/* AI Summary if present */}
        {aiExplanation && (
          <div className="bg-[#0A1C16]/80 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 text-white font-semibold mb-3 pb-2 border-b border-white/10">
              <Sparkles className="w-4 h-4 text-[#B8F25C]" />
              <h3>NNOO AI Passport Summary</h3>
            </div>
            <h4 className="text-base font-bold text-white mb-2">{aiExplanation.headline}</h4>
            <p className="text-sm text-white/70 leading-relaxed">{aiExplanation.overview}</p>
          </div>
        )}

        {/* Disclaimers & Legal Boundary */}
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

        {/* Footer */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
          <p>© {new Date().getFullYear()} NNOO Business Operating System. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href={`/passport/verify?code=${passportCode}`} className="hover:text-white transition">
              Verify Passport
            </Link>
            <Link href="/" className="hover:text-white transition">
              About NNOO
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
