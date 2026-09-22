'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Clock,
  History,
  X,
  Info,
} from 'lucide-react';
import type {
  BusinessHealthScoreResult,
  BusinessHealthScoreSnapshot,
  BusinessHealthExplanation,
  BusinessHealthReasonKey,
  BusinessHealthActionKey,
  BusinessHealthScoreBand,
} from '@nnoo/contracts';
import { ASK_NNOO_ACTION_REGISTRY } from '@nnoo/contracts';

interface HealthScoreDashboardProps {
  businessId: string;
  businessSlug: string;
  userRole: string;
}

const REASON_HUMAN_LABELS: Record<BusinessHealthReasonKey, string> = {
  GROSS_PROFIT_STRONG: 'Gross profit margins are strong (40%+)',
  GROSS_PROFIT_HEALTHY: 'Gross profit margins are healthy (20%–40%)',
  GROSS_PROFIT_LOW: 'Gross profit margins are thin (<20%)',
  GROSS_PROFIT_NEGATIVE: 'Gross profit is currently negative',
  OPERATING_RESULT_POSITIVE: 'Operating activities generated positive net profit',
  OPERATING_RESULT_NEGATIVE: 'Operating expenses exceeded gross profits (operating loss)',
  SALES_VOLUME_ADEQUATE: 'Steady volume of customer sales recorded',
  SALES_VOLUME_LOW: 'Sales activity is low or not recorded',
  EXPENSE_MANAGEMENT_EFFICIENT: 'Operating expenses are well-managed relative to gross profit',
  EXPENSE_PRESSURE_MODERATE: 'Operating expenses are moderate relative to revenue',
  EXPENSE_PRESSURE_ELEVATED: 'Operating expenses are elevated relative to gross profits',
  EXPENSES_EXCEED_GROSS_PROFIT: 'Operating expenses exceed total gross profit',
  RECEIVABLES_MINIMAL: 'No outstanding customer credit balances',
  RECEIVABLES_HEALTHY: 'Customer receivables are manageable relative to sales',
  RECEIVABLES_ELEVATED: 'High proportion of sales locked in uncollected receivables',
  OVERDUE_INVOICES_PRESENT: 'Some sales invoices are past their payment due dates',
  NO_OVERDUE_INVOICES: 'All issued sales invoices are current',
  PAYABLES_CLEAN: 'No outstanding supplier liabilities recorded',
  PAYABLES_MANAGEABLE: 'Supplier obligations are manageable relative to profit',
  PAYABLES_ELEVATED: 'High supplier payables relative to gross profit',
  INVENTORY_OPTIMAL: 'Inventory is healthy with no low-stock or out-of-stock items',
  INVENTORY_STABLE: 'Inventory levels are mostly stable across tracked items',
  LOW_STOCK_ALERT: 'Some tracked products have fallen below reorder thresholds',
  OUT_OF_STOCK_ALERT: 'Some tracked products are completely out of stock',
  INVENTORY_NOT_APPLICABLE: 'Inventory tracking is not configured for this business',
  DATA_COVERAGE_COMPREHENSIVE: 'Comprehensive operational history recorded',
  DATA_COVERAGE_ESTABLISHED: 'Established operational transaction history',
  DATA_COVERAGE_EARLY: 'Early operational data available',
  DATA_COVERAGE_INSUFFICIENT: 'Insufficient operational records to calculate score',
};

const BAND_CONFIGS: Record<
  BusinessHealthScoreBand,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  STRONG: {
    label: 'Strong',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    desc: 'Solid operational margins, controlled expenses, and healthy balance sheet.',
  },
  GOOD: {
    label: 'Good',
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    border: 'border-teal-500/30',
    desc: 'Healthy operational baseline with minor areas to monitor.',
  },
  FAIR: {
    label: 'Fair',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    desc: 'Acceptable baseline, with noticeable margin, expense, or receivable pressures.',
  },
  NEEDS_ATTENTION: {
    label: 'Needs Attention',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    desc: 'Significant financial pressure, overdue receivables, or operating losses.',
  },
};

export function HealthScoreDashboard({
  businessId,
  businessSlug,
  userRole,
}: HealthScoreDashboardProps) {
  const [scoreData, setScoreData] = useState<BusinessHealthScoreResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<BusinessHealthExplanation | null>(null);
  const [historyList, setHistoryList] = useState<BusinessHealthScoreSnapshot[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch initial current score
  useEffect(() => {
    async function loadScore() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch(`/api/v1/ai/health/score?businessId=${businessId}`);
        const json = await res.json();
        if (json.success) {
          setScoreData(json.data);
          if (json.data.explanation) {
            setExplanation(json.data.explanation);
          }
        } else {
          setErrorMessage(json.error?.message || 'Failed to load Business Health Score.');
        }
      } catch (err: any) {
        setErrorMessage('Network error loading Business Health Score.');
      } finally {
        setIsLoading(false);
      }
    }
    loadScore();
  }, [businessId]);

  // Recalculate score (0 AI calls)
  const handleRefreshScore = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/v1/ai/health/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          idempotencyKey: `refresh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setScoreData(json.data);
        if (json.data.explanation) {
          setExplanation(json.data.explanation);
        } else {
          setExplanation(null);
        }
      } else {
        setErrorMessage(json.error?.message || 'Failed to update score.');
      }
    } catch (err: any) {
      setErrorMessage('Network error updating score.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Generate AI Explanation
  const handleExplainScore = async () => {
    setIsExplaining(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/v1/ai/health/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      const json = await res.json();
      if (json.success) {
        setExplanation(json.data);
      } else {
        setErrorMessage(json.error?.message || 'Failed to generate explanation.');
      }
    } catch (err: any) {
      setErrorMessage('Network error generating explanation.');
    } finally {
      setIsExplaining(false);
    }
  };

  // Load history drawer
  const handleOpenHistory = async () => {
    setShowHistory(true);
    try {
      const res = await fetch(`/api/v1/ai/health/history?businessId=${businessId}&limit=15`);
      const json = await res.json();
      if (json.success) {
        setHistoryList(json.data);
      }
    } catch (err) {
      // Ignored
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <Activity className="w-10 h-10 text-emerald-400 animate-pulse mb-4" />
        <h2 className="text-lg font-medium text-white">Analyzing Business Health...</h2>
        <p className="text-sm text-gray-400 mt-1">Retrieving verified operational records and metrics</p>
      </div>
    );
  }

  if (errorMessage && !scoreData) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 text-center max-w-lg mx-auto mt-8">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">Unable to Load Health Score</h3>
        <p className="text-sm text-rose-300 mt-1">{errorMessage}</p>
        <button
          onClick={handleRefreshScore}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  const isInsufficient = scoreData?.status === 'INSUFFICIENT_DATA';
  const band = scoreData?.scoreBand ? BAND_CONFIGS[scoreData.scoreBand] : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Business Health Score</h1>
              <p className="text-sm text-gray-400">
                Deterministic operational indicator calculated exclusively from verified NNOO records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenHistory}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium rounded-xl border border-white/10 transition-colors"
          >
            <History className="w-4 h-4 text-gray-400" />
            History
          </button>
          <button
            onClick={handleRefreshScore}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-900/20 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Recalculating...' : 'Update Score'}
          </button>
        </div>
      </div>

      {/* Main Score Hero Card */}
      {isInsufficient ? (
        <div className="bg-[#0A1C16] border border-amber-500/30 rounded-2xl p-8 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-400 mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Not Enough Data Yet</h2>
          <p className="text-sm text-gray-300 mt-2 max-w-md mx-auto">
            NNOO needs more recorded transactions before it can calculate a meaningful Health Score. Record customer sales, expenses, and invoices to establish your operational baseline.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/app/${businessSlug}/sales/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Record First Sale
            </Link>
            <Link
              href={`/app/${businessSlug}/expenses/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-gray-200 text-sm font-medium rounded-xl transition-colors"
            >
              Record First Expense
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#0A1C16] border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Score Ring & Value */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center text-center p-4 border-b lg:border-b-0 lg:border-r border-white/10">
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* SVG Gauge Progress Ring */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="stroke-white/10"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className={`${scoreData?.score && scoreData.score >= 80 ? 'stroke-emerald-400' : scoreData?.score && scoreData.score >= 65 ? 'stroke-teal-400' : scoreData?.score && scoreData.score >= 50 ? 'stroke-amber-400' : 'stroke-rose-400'} transition-all duration-1000 ease-out`}
                    strokeWidth="8"
                    strokeDasharray={326.7}
                    strokeDashoffset={326.7 - (326.7 * (scoreData?.score || 0)) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-5xl font-black text-white tracking-tight"
                    aria-label={`Business Health Score ${scoreData?.score} out of 100`}
                  >
                    {scoreData?.score}
                  </span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-0.5">
                    out of 100
                  </span>
                </div>
              </div>

              {/* Score Band Badge */}
              {band && (
                <div
                  className={`mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${band.bg} ${band.text} ${band.border} border`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {band.label}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2 max-w-xs">{band?.desc}</p>
            </div>

            {/* Overview & Metadata */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-xl p-3.5">
                  <span className="text-xs text-gray-400 block font-medium">Data Coverage</span>
                  <span
                    className={`text-sm font-semibold capitalize mt-0.5 block ${scoreData?.dataCoverage === 'HIGH' ? 'text-emerald-400' : scoreData?.dataCoverage === 'MEDIUM' ? 'text-teal-400' : 'text-amber-400'}`}
                  >
                    {scoreData?.dataCoverage.toLowerCase()}
                  </span>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-3.5">
                  <span className="text-xs text-gray-400 block font-medium">Evaluation Period</span>
                  <span className="text-sm font-semibold text-white mt-0.5 block truncate">
                    {scoreData?.evaluationPeriod.start} – {scoreData?.evaluationPeriod.end}
                  </span>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 col-span-2 sm:col-span-1">
                  <span className="text-xs text-gray-400 block font-medium">Formula Version</span>
                  <span className="text-sm font-semibold text-gray-300 mt-0.5 block font-mono text-xs truncate">
                    {scoreData?.formulaVersion}
                  </span>
                </div>
              </div>

              {/* Helping & Needs Attention Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    What is Helping
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    {scoreData?.strengthReasonKeys && scoreData.strengthReasonKeys.length > 0 ? (
                      scoreData.strengthReasonKeys.map((k) => (
                        <li key={k} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{REASON_HUMAN_LABELS[k] || k}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400 italic">No significant positive signals recorded</li>
                    )}
                  </ul>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    Needs Attention
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    {scoreData?.attentionReasonKeys && scoreData.attentionReasonKeys.length > 0 ? (
                      scoreData.attentionReasonKeys.map((k) => (
                        <li key={k} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{REASON_HUMAN_LABELS[k] || k}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400 italic">No critical attention items identified</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Explain Button */}
              {!explanation && (
                <div className="pt-2">
                  <button
                    onClick={handleExplainScore}
                    disabled={isExplaining}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
                  >
                    <Sparkles className={`w-4 h-4 ${isExplaining ? 'animate-spin' : ''}`} />
                    {isExplaining ? 'NNOO AI is analyzing score...' : 'Explain My Score with AI'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Optional AI Explanation Card */}
      {explanation && (
        <div className="bg-[#0A1C16] border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" />
            NNOO AI Score Explanation
          </div>
          <h3 className="text-base font-bold text-white mb-2">{explanation.headline}</h3>
          <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{explanation.overview}</p>
        </div>
      )}

      {/* Dimension Breakdown Cards */}
      {scoreData?.dimensions && scoreData.dimensions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white tracking-tight">Dimension Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scoreData.dimensions.map((dim) => {
              const isNotApplicable = dim.status === 'NOT_APPLICABLE';
              return (
                <div
                  key={dim.key}
                  className="bg-[#0A1C16] border border-white/10 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-white/20 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{dim.name}</h3>
                        <span className="text-xs text-gray-400 block font-medium">
                          Weight: {dim.appliedWeight}% {isNotApplicable ? '(N/A)' : ''}
                        </span>
                      </div>
                      {isNotApplicable ? (
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-gray-400 text-xs rounded-md">
                          N/A
                        </span>
                      ) : (
                        <span
                          className={`text-lg font-bold ${dim.score && dim.score >= 80 ? 'text-emerald-400' : dim.score && dim.score >= 65 ? 'text-teal-400' : dim.score && dim.score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}
                        >
                          {dim.score}
                          <span className="text-xs text-gray-500 font-normal">/100</span>
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {!isNotApplicable && dim.score !== null && (
                      <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${dim.score >= 80 ? 'bg-emerald-400' : dim.score >= 65 ? 'bg-teal-400' : dim.score >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Dimension Specific Reasons */}
                  <div className="pt-2 border-t border-white/5 space-y-1">
                    {dim.reasonKeys.map((rk) => (
                      <p key={rk} className="text-xs text-gray-400 flex items-start gap-1.5">
                        <span className="text-gray-500">•</span>
                        <span>{REASON_HUMAN_LABELS[rk] || rk}</span>
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {scoreData?.actionKeys && scoreData.actionKeys.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white tracking-tight">Recommended Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {scoreData.actionKeys.map((actKey) => {
              const actDef = ASK_NNOO_ACTION_REGISTRY[actKey as keyof typeof ASK_NNOO_ACTION_REGISTRY];
              if (!actDef) return null;
              return (
                <Link
                  key={actKey}
                  href={`/app/${businessSlug}${actDef.routePath}`}
                  className="bg-[#0A1C16] border border-white/10 hover:border-emerald-500/30 rounded-xl p-4 flex items-center justify-between group transition-all"
                >
                  <div>
                    <h4 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                      {actDef.label}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{actDef.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Regulatory & Non-Credit Disclaimer */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3 text-xs text-gray-400">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-gray-300">Non-Credit Operational Index:</strong> The NNOO Business Health Score is an internal operational health indicator derived deterministically from records available inside NNOO. It is not a bank credit score, credit bureau score, loan qualification, or regulatory certification.
        </p>
      </div>

      {/* History Drawer Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/70 flex justify-end">
          <div className="w-full max-w-md bg-[#0A1C16] border-l border-white/10 h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Score History</h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {historyList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">No historical snapshots saved yet.</p>
            ) : (
              <div className="space-y-3">
                {historyList.map((snap) => (
                  <div
                    key={snap.id}
                    className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs text-gray-400 block" suppressHydrationWarning>
                        {new Date(snap.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-xs font-mono text-gray-500">{snap.formulaVersion}</span>
                    </div>
                    <div className="text-right">
                      {snap.score !== null ? (
                        <>
                          <span className="text-lg font-bold text-white">{snap.score}</span>
                          <span className="text-xs text-gray-400 block uppercase font-semibold">
                            {snap.scoreBand}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-amber-400 font-medium">Insufficient Data</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
