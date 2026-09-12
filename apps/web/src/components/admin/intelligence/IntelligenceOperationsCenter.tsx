'use client';

import React, { useState, useEffect } from 'react';
import type {
  IntelligenceAdminOverview,
  AiOperationsMetrics,
  BookkeeperOperationsMetrics,
  HealthOperationsMetrics,
  CreditPassportOperationsMetrics,
  AutomationOperationsMetrics,
  WhatsAppOperationsMetrics,
  PlatformFeatureControl,
  IntelligenceReportingPeriod,
} from '@nnoo/contracts/ai';
import {
  Cpu,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  MessageSquare,
  FileSpreadsheet,
  HeartPulse,
  Award,
  Layers,
  Power,
  RotateCcw,
  Clock,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface IntelligenceOperationsCenterProps {
  initialOverview: IntelligenceAdminOverview;
}

export function IntelligenceOperationsCenter({
  initialOverview,
}: IntelligenceOperationsCenterProps) {
  const [period, setPeriod] = useState<IntelligenceReportingPeriod>(initialOverview.period || '24h');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'ai_platform' | 'bookkeeper' | 'health_passport' | 'automations' | 'whatsapp' | 'controls'
  >('overview');

  const [overview, setOverview] = useState<IntelligenceAdminOverview>(initialOverview);
  const [aiMetrics, setAiMetrics] = useState<AiOperationsMetrics | null>(null);
  const [bookkeeperMetrics, setBookkeeperMetrics] = useState<BookkeeperOperationsMetrics | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthOperationsMetrics | null>(null);
  const [passportMetrics, setPassportMetrics] = useState<CreditPassportOperationsMetrics | null>(null);
  const [automationMetrics, setAutomationMetrics] = useState<AutomationOperationsMetrics | null>(null);
  const [whatsappMetrics, setWhatsappMetrics] = useState<WhatsAppOperationsMetrics | null>(null);
  const [controls, setControls] = useState<PlatformFeatureControl[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals state
  const [modalType, setModalType] = useState<'control' | 'job_retry' | 'whatsapp_retry' | null>(null);
  const [selectedControl, setSelectedControl] = useState<PlatformFeatureControl | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [auditReason, setAuditReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Fetch overview when period changes
  const fetchOverview = async (selectedPeriod: IntelligenceReportingPeriod) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/intelligence/overview?period=${selectedPeriod}`);
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (e: any) {
      console.error('Failed to fetch overview:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tab-specific data on tab switch
  useEffect(() => {
    fetchOverview(period);

    if (activeTab === 'ai_platform') {
      fetch(`/api/v1/admin/intelligence/ai-operations?period=${period}`)
        .then((r) => r.json())
        .then(setAiMetrics)
        .catch(console.error);
    } else if (activeTab === 'bookkeeper') {
      fetch(`/api/v1/admin/intelligence/bookkeeper?period=${period}`)
        .then((r) => r.json())
        .then(setBookkeeperMetrics)
        .catch(console.error);
    } else if (activeTab === 'health_passport') {
      fetch(`/api/v1/admin/intelligence/health?period=${period}`)
        .then((r) => r.json())
        .then(setHealthMetrics)
        .catch(console.error);
      fetch(`/api/v1/admin/intelligence/credit-passport?period=${period}`)
        .then((r) => r.json())
        .then(setPassportMetrics)
        .catch(console.error);
    } else if (activeTab === 'automations') {
      fetch(`/api/v1/admin/intelligence/automations?period=${period}`)
        .then((r) => r.json())
        .then(setAutomationMetrics)
        .catch(console.error);
    } else if (activeTab === 'whatsapp') {
      fetch(`/api/v1/admin/intelligence/whatsapp?period=${period}`)
        .then((r) => r.json())
        .then(setWhatsappMetrics)
        .catch(console.error);
    } else if (activeTab === 'controls') {
      fetch(`/api/v1/admin/intelligence/controls`)
        .then((r) => r.json())
        .then((d) => setControls(d.controls || []))
        .catch(console.error);
    }
  }, [activeTab, period]);

  // Handle Feature Control toggle submit
  const handleControlSubmit = async () => {
    if (!selectedControl || !auditReason.trim()) return;
    setIsSubmittingAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/v1/admin/intelligence/controls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureKey: selectedControl.featureKey,
          enabled: !selectedControl.enabled,
          reason: auditReason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update feature control');
      }

      setActionSuccess(`Control '${selectedControl.featureKey}' successfully updated.`);
      setModalType(null);
      setAuditReason('');
      // Refresh controls
      const cRes = await fetch('/api/v1/admin/intelligence/controls');
      const cData = await cRes.json();
      setControls(cData.controls || []);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Job Retry submit
  const handleJobRetrySubmit = async () => {
    if (!selectedJobId || !auditReason.trim()) return;
    setIsSubmittingAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/v1/admin/intelligence/jobs/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobRunId: selectedJobId,
          reason: auditReason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to retry background job');
      }

      setActionSuccess(`Job retry scheduled successfully: ${json.message}`);
      setModalType(null);
      setSelectedJobId(null);
      setAuditReason('');
      // Refresh automations tab
      const aRes = await fetch(`/api/v1/admin/intelligence/automations?period=${period}`);
      const aData = await aRes.json();
      setAutomationMetrics(aData);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle WhatsApp Retry submit
  const handleWhatsAppRetrySubmit = async () => {
    if (!selectedDeliveryId || !auditReason.trim()) return;
    setIsSubmittingAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/v1/admin/intelligence/whatsapp/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryId: selectedDeliveryId,
          reason: auditReason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to retry WhatsApp delivery');
      }

      setActionSuccess(`WhatsApp delivery retried successfully.`);
      setModalType(null);
      setSelectedDeliveryId(null);
      setAuditReason('');
      // Refresh whatsapp tab
      const wRes = await fetch(`/api/v1/admin/intelligence/whatsapp?period=${period}`);
      const wData = await wRes.json();
      setWhatsappMetrics(wData);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 size={12} /> Healthy
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800">
            <AlertTriangle size={12} /> Degraded
          </span>
        );
      case 'NOT_CONFIGURED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-900 text-zinc-400 border border-zinc-700">
            <Power size={12} /> Not Configured
          </span>
        );
      case 'UNAVAILABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-800">
            <XCircle size={12} /> Unavailable
          </span>
        );
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#B8F25C]/10 border border-[#B8F25C]/20 text-[#B8F25C]">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Intelligence Operations Center</h1>
              <p className="text-sm text-zinc-400">
                Authoritative platform monitoring, telemetry, and emergency controls for all NNOO intelligence systems.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Window Switcher */}
          <div className="flex bg-[#0A1C16] border border-[rgba(255,255,255,0.1)] rounded-lg p-1">
            {(['24h', '7d', '30d'] as IntelligenceReportingPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  fetchOverview(p);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  period === p
                    ? 'bg-[#B8F25C] text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {p === '24h' ? '24 Hours' : p === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchOverview(period)}
            disabled={isLoading}
            className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-zinc-300 hover:text-white border border-[rgba(255,255,255,0.1)] transition-colors disabled:opacity-50"
            title="Refresh Metrics"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Invariant Banner */}
      <div className="bg-[#0A1C16]/80 border border-[#B8F25C]/20 rounded-xl p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-[#B8F25C] shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300 space-y-1">
          <p className="font-semibold text-white">Platform Admin Observability & Safety Invariant</p>
          <p>
            Platform Admins have full diagnostic observability and emergency pause controls across all 8 intelligence subsystems.
            Platform Admin cannot create or modify business financial records (sales, expenses, inventory, invoices), alter deterministic
            Health Scores, overwrite Credit Passports, or override user WhatsApp STOP opt-outs.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-200 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-200 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto space-x-2 border-b border-[rgba(255,255,255,0.08)] pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'System Overview', icon: Activity },
          { id: 'ai_platform', label: 'AI Platform & Costs', icon: Zap },
          { id: 'bookkeeper', label: 'AI Bookkeeper', icon: FileSpreadsheet },
          { id: 'health_passport', label: 'Health & Passports', icon: HeartPulse },
          { id: 'automations', label: 'Automations & Jobs', icon: Layers },
          { id: 'whatsapp', label: 'Messaging & WhatsApp', icon: MessageSquare },
          { id: 'controls', label: 'Feature Controls & Audit', icon: Power },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-[#B8F25C] text-black font-semibold shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* AI Platform Card */}
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-zinc-300 font-semibold text-sm">
                  <Zap className="h-4 w-4 text-[#B8F25C]" /> AI Invocations
                </div>
                {getStatusBadge(overview.aiPlatform.status)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{overview.aiPlatform.totalRequests.toLocaleString()}</p>
                <p className="text-xs text-zinc-400">
                  {overview.aiPlatform.successful} succeeded · {overview.aiPlatform.failed} failed
                </p>
              </div>
              <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] text-xs text-zinc-500 truncate">
                Model: <span className="text-zinc-300 font-mono">{overview.aiPlatform.model}</span>
              </div>
            </div>

            {/* AI Bookkeeper Card */}
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-zinc-300 font-semibold text-sm">
                  <FileSpreadsheet className="h-4 w-4 text-[#B8F25C]" /> AI Bookkeeper
                </div>
                {getStatusBadge(overview.bookkeeper.status)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{overview.bookkeeper.totalClassifications.toLocaleString()}</p>
                <p className="text-xs text-zinc-400">
                  {overview.bookkeeper.pendingReviews} pending review · {overview.bookkeeper.validationFailures} failures
                </p>
              </div>
              <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] text-xs text-zinc-500">
                Mode: <span className="text-zinc-300">Human Review Mandatory</span>
              </div>
            </div>

            {/* Business Health Card */}
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-zinc-300 font-semibold text-sm">
                  <HeartPulse className="h-4 w-4 text-[#B8F25C]" /> Business Health
                </div>
                {getStatusBadge(overview.businessHealth.status)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{overview.businessHealth.totalCalculations.toLocaleString()}</p>
                <p className="text-xs text-zinc-400">
                  {overview.businessHealth.insufficientData} insufficient data · {overview.businessHealth.failures} failures
                </p>
              </div>
              <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] text-xs text-zinc-500">
                Formula: <span className="text-zinc-300 font-mono">{overview.businessHealth.activeFormula}</span>
              </div>
            </div>

            {/* WhatsApp Operations Card */}
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-zinc-300 font-semibold text-sm">
                  <MessageSquare className="h-4 w-4 text-[#B8F25C]" /> WhatsApp Business
                </div>
                {getStatusBadge(overview.whatsapp.status)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{overview.whatsapp.activeConnections.toLocaleString()}</p>
                <p className="text-xs text-zinc-400">
                  {overview.whatsapp.delivered} delivered · {overview.whatsapp.failed} failed
                </p>
              </div>
              <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] text-xs text-zinc-500">
                Active Connections: <span className="text-zinc-300">{overview.whatsapp.activeConnections}</span>
              </div>
            </div>

            {/* Credit Passport Card */}
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-zinc-300 font-semibold text-sm">
                  <Award className="h-4 w-4 text-[#B8F25C]" /> Credit Passport
                </div>
                {getStatusBadge(overview.creditPassport.status)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{overview.creditPassport.totalGenerated.toLocaleString()}</p>
                <p className="text-xs text-zinc-400">
                  {overview.creditPassport.activeShares} active shares · {overview.creditPassport.generationFailures} errors
                </p>
              </div>
              <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] text-xs text-zinc-500">
                Integrity: <span className="text-emerald-400">Verified & Immutable</span>
              </div>
            </div>

            {/* Automations Card */}
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-zinc-300 font-semibold text-sm">
                  <Layers className="h-4 w-4 text-[#B8F25C]" /> Intelligence Jobs
                </div>
                {getStatusBadge(overview.automations.status)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{(overview.automations.succeeded + overview.automations.failed).toLocaleString()}</p>
                <p className="text-xs text-zinc-400">
                  {overview.automations.succeeded} succeeded · {overview.automations.failed} failed
                </p>
              </div>
              <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] text-xs text-zinc-500">
                Skipped: <span className="text-zinc-300">{overview.automations.skipped}</span>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-zinc-300 font-semibold text-sm">
                  <Activity className="h-4 w-4 text-[#B8F25C]" /> In-App Notifications
                </div>
                {getStatusBadge(overview.notifications.status)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{overview.notifications.inAppCreated.toLocaleString()}</p>
                <p className="text-xs text-zinc-400">
                  {overview.notifications.deduplicated} deduplicated · {overview.notifications.preferenceSkipped} skipped
                </p>
              </div>
              <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] text-xs text-zinc-500">
                Channel: <span className="text-zinc-300">In-App & Attention</span>
              </div>
            </div>

            {/* Ask NNOO Card */}
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-zinc-300 font-semibold text-sm">
                  <MessageSquare className="h-4 w-4 text-[#B8F25C]" /> Ask NNOO Assistant
                </div>
                {getStatusBadge(overview.askNnoo.status)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{overview.askNnoo.totalRequests.toLocaleString()}</p>
                <p className="text-xs text-zinc-400">
                  {overview.askNnoo.validationFailures} validation failures
                </p>
              </div>
              <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] text-xs text-zinc-500">
                Privacy: <span className="text-emerald-400">Zero Conversation Snooping</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI PLATFORM & COSTS */}
      {activeTab === 'ai_platform' && aiMetrics && (
        <div className="space-y-8">
          {/* Top KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Provider Status</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold text-white font-mono">{aiMetrics.providerStatus.configuredModel}</span>
                {getStatusBadge(aiMetrics.providerStatus.status)}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Avg Latency: <span className="text-white font-semibold">{aiMetrics.averageLatencyMs}ms</span>
              </p>
            </div>

            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Total Invocations</p>
              <p className="mt-2 text-2xl font-bold text-white">{aiMetrics.totalInvocations.toLocaleString()}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {aiMetrics.successfulInvocations} succeeded · {aiMetrics.failedInvocations} failed
              </p>
            </div>

            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Token Consumption</p>
              <p className="mt-2 text-2xl font-bold text-white">{aiMetrics.totalTokens.toLocaleString()}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {aiMetrics.totalInputTokens.toLocaleString()} in · {aiMetrics.totalOutputTokens.toLocaleString()} out
              </p>
            </div>

            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Estimated AI Cost</p>
              <p className="mt-2 text-2xl font-bold text-[#B8F25C]">
                {aiMetrics.estimatedTotalCostUsd !== null ? `$${aiMetrics.estimatedTotalCostUsd.toFixed(4)}` : 'Unavailable'}
              </p>
              <p className="mt-1 text-xs text-zinc-500 truncate" title={aiMetrics.costLabel}>
                {aiMetrics.costLabel}
              </p>
            </div>
          </div>

          {/* Usage by Feature Table */}
          <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <h2 className="text-base font-bold text-white">AI Feature Usage & Cost Breakdown</h2>
              <span className="text-xs text-zinc-400">Telemetry per feature</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[rgba(255,255,255,0.02)] text-zinc-400 text-xs uppercase font-medium border-b border-[rgba(255,255,255,0.06)]">
                  <tr>
                    <th className="px-5 py-3">Feature</th>
                    <th className="px-5 py-3">Invocations</th>
                    <th className="px-5 py-3">Success Rate</th>
                    <th className="px-5 py-3">Total Tokens</th>
                    <th className="px-5 py-3">Avg Latency</th>
                    <th className="px-5 py-3">Estimated Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-zinc-300">
                  {aiMetrics.features.map((f) => {
                    const successRate = f.invocations > 0 ? Math.round((f.successful / f.invocations) * 100) : 100;
                    return (
                      <tr key={f.featureKey} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                        <td className="px-5 py-3.5 font-medium text-white">
                          <div>{f.featureName}</div>
                          <span className="text-xs text-zinc-500 font-mono">{f.featureKey}</span>
                        </td>
                        <td className="px-5 py-3.5">{f.invocations.toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          <span className={`font-semibold ${successRate >= 95 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {successRate}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs">{f.totalTokens.toLocaleString()}</td>
                        <td className="px-5 py-3.5 font-mono text-xs">{f.averageLatencyMs}ms</td>
                        <td className="px-5 py-3.5 font-semibold text-[#B8F25C]">
                          {f.estimatedCostUsd !== null ? `$${f.estimatedCostUsd.toFixed(4)}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model and Prompt Registries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Allowlisted Models */}
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#B8F25C]" /> Allowlisted AI Model Registry
                </h3>
                <span className="text-xs text-zinc-400">Strict Model Policy</span>
              </div>
              <div className="space-y-3">
                {aiMetrics.modelRegistry.map((m) => (
                  <div key={m.featureKey} className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{m.featureName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {m.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-[#B8F25C]">{m.modelId}</p>
                    <p className="text-[11px] text-zinc-500">
                      Pricing: ${m.inputPricePer1MTokensUsd}/1M in · ${m.outputPricePer1MTokensUsd}/1M out
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Source-Controlled Prompts */}
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#B8F25C]" /> Source-Controlled Prompts
                </h3>
                <span className="text-xs text-zinc-400">Git Deployed Only</span>
              </div>
              <div className="space-y-3">
                {aiMetrics.promptRegistry.map((p) => (
                  <div key={p.featureKey} className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{p.featureName}</span>
                      <span className="text-[10px] font-mono text-zinc-400 bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded">
                        {p.promptVersion}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{p.description}</p>
                    <p className="text-[10px] font-mono text-zinc-500">Schema: {p.responseSchemaVersion}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Failures */}
          {aiMetrics.recentFailures.length > 0 && (
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
              <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" /> Recent AI Invocations Failures
                </h3>
                <span className="text-xs text-zinc-400">Sanitized Telemetry Only</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[rgba(255,255,255,0.02)] text-zinc-400 uppercase">
                    <tr>
                      <th className="px-5 py-3">Timestamp</th>
                      <th className="px-5 py-3">Feature</th>
                      <th className="px-5 py-3">Model</th>
                      <th className="px-5 py-3">Error Code</th>
                      <th className="px-5 py-3">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-zinc-300 font-mono">
                    {aiMetrics.recentFailures.map((r) => (
                      <tr key={r.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="px-5 py-3 text-zinc-400">{new Date(r.createdAt).toLocaleString()}</td>
                        <td className="px-5 py-3 text-white">{r.featureKey}</td>
                        <td className="px-5 py-3">{r.modelId}</td>
                        <td className="px-5 py-3 text-rose-400 font-semibold">{r.errorCode}</td>
                        <td className="px-5 py-3">{r.latencyMs || 0}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI BOOKKEEPER */}
      {activeTab === 'bookkeeper' && bookkeeperMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Total Classifications</p>
              <p className="mt-2 text-2xl font-bold text-white">{bookkeeperMetrics.totalClassifications.toLocaleString()}</p>
              <p className="mt-1 text-xs text-zinc-400">{bookkeeperMetrics.validClassifications} valid</p>
            </div>

            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Pending Human Reviews</p>
              <p className="mt-2 text-2xl font-bold text-amber-400">{bookkeeperMetrics.pendingReviewsCount.toLocaleString()}</p>
              <p className="mt-1 text-xs text-zinc-500">Awaiting business confirmation</p>
            </div>

            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Confirmed Applications</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">{bookkeeperMetrics.confirmedApplicationsCount.toLocaleString()}</p>
              <p className="mt-1 text-xs text-zinc-500">{bookkeeperMetrics.rejectedReviewsCount} rejected by user</p>
            </div>

            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Low Confidence Alerts</p>
              <p className="mt-2 text-2xl font-bold text-zinc-300">{bookkeeperMetrics.lowConfidenceCount.toLocaleString()}</p>
              <p className="mt-1 text-xs text-zinc-500">{bookkeeperMetrics.validationFailures} validation failures</p>
            </div>
          </div>

          <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Bookkeeper Governance Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300">
              <div className="p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] space-y-1">
                <p className="font-semibold text-white">1. Zero Auto-Posting to Ledger</p>
                <p>Every transaction classification is stored as a candidate suggestion until confirmed by authorized business staff.</p>
              </div>
              <div className="p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] space-y-1">
                <p className="font-semibold text-white">2. Platform Admin cannot Confirm</p>
                <p>Platform Admins cannot accept or reject bookkeeper suggestions on behalf of businesses to protect ledger integrity.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HEALTH & PASSPORTS */}
      {activeTab === 'health_passport' && healthMetrics && passportMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Health Score Overview */}
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-[#B8F25C]" /> Business Health Score Engine
                </h3>
                {getStatusBadge(healthMetrics.status)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)]">
                  <p className="text-xs text-zinc-400">Total Calculations</p>
                  <p className="text-xl font-bold text-white mt-1">{healthMetrics.totalCalculations}</p>
                </div>
                <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)]">
                  <p className="text-xs text-zinc-400">Insufficient Data</p>
                  <p className="text-xl font-bold text-amber-400 mt-1">{healthMetrics.insufficientDataCount}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-xs text-zinc-400 space-y-1">
                <p className="font-semibold text-white">Active Formula: {healthMetrics.activeFormulaVersion}</p>
                <p>5 Deterministic Dimensions: Sales Profitability (25%), Operating Efficiency (20%), Receivables (20%), Obligations (20%), Inventory (15%).</p>
                <p className="text-emerald-400 font-medium">Read-Only: Platform Admin cannot manually alter scores or weights.</p>
              </div>
            </div>

            {/* Credit Passport Overview */}
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#B8F25C]" /> Credit Passport Integrity
                </h3>
                {getStatusBadge(passportMetrics.status)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)]">
                  <p className="text-xs text-zinc-400">Passports Generated</p>
                  <p className="text-xl font-bold text-white mt-1">{passportMetrics.totalGenerated}</p>
                </div>
                <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)]">
                  <p className="text-xs text-zinc-400">Active Share Links</p>
                  <p className="text-xl font-bold text-[#B8F25C] mt-1">{passportMetrics.activeSharesCount}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-xs text-zinc-400 space-y-1">
                <p className="font-semibold text-white">Artifact Verification & Immutability</p>
                <p>Expired Shares: {passportMetrics.expiredSharesCount} · Revoked Shares: {passportMetrics.revokedSharesCount}</p>
                <p className="text-emerald-400 font-medium">Snapshot hashes are cryptographically verified against tampering.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUTOMATIONS & JOBS */}
      {activeTab === 'automations' && automationMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Enabled Automations</p>
              <p className="mt-2 text-2xl font-bold text-white">{automationMetrics.enabledAutomationsCount}</p>
            </div>

            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Succeeded Job Runs</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">{automationMetrics.succeededRuns}</p>
            </div>

            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Failed Job Runs</p>
              <p className="mt-2 text-2xl font-bold text-rose-400">{automationMetrics.failedRuns}</p>
            </div>

            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Skipped Job Runs</p>
              <p className="mt-2 text-2xl font-bold text-zinc-400">{automationMetrics.skippedRuns}</p>
            </div>
          </div>

          {/* Failed Job List & Safe Retry */}
          <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" /> Failed Background Jobs (Safe Idempotent Retry)
              </h3>
              <span className="text-xs text-zinc-400">Rechecks active business & automation</span>
            </div>
            {automationMetrics.recentFailures.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-400">No failed background jobs recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[rgba(255,255,255,0.02)] text-zinc-400 uppercase">
                    <tr>
                      <th className="px-5 py-3">Timestamp</th>
                      <th className="px-5 py-3">Job Type</th>
                      <th className="px-5 py-3">Attempts</th>
                      <th className="px-5 py-3">Error Code</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-zinc-300 font-mono">
                    {automationMetrics.recentFailures.map((job) => (
                      <tr key={job.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="px-5 py-3 text-zinc-400">{new Date(job.startedAt).toLocaleString()}</td>
                        <td className="px-5 py-3 text-white">{job.jobType}</td>
                        <td className="px-5 py-3">{job.attemptCount}</td>
                        <td className="px-5 py-3 text-rose-400">{job.errorCode}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setModalType('job_retry');
                              setAuditReason('');
                            }}
                            className="px-3 py-1 bg-[#B8F25C] text-black font-sans font-semibold rounded hover:bg-[#a6dc4f] transition-colors"
                          >
                            Retry Job
                          </button>
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

      {/* TAB 6: MESSAGING & WHATSAPP */}
      {activeTab === 'whatsapp' && whatsappMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Provider Status</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold text-white">Meta Cloud API</span>
                {getStatusBadge(whatsappMetrics.status)}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Webhook: <span className="text-emerald-400">{whatsappMetrics.webhookHealth}</span>
              </p>
            </div>

            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Active Connections</p>
              <p className="mt-2 text-2xl font-bold text-white">{whatsappMetrics.activeConnectionsCount}</p>
              <p className="mt-1 text-xs text-zinc-500">{whatsappMetrics.optedOutConnectionsCount} opted out (STOP)</p>
            </div>

            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Delivered Messages</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">{whatsappMetrics.messagesDelivered}</p>
              <p className="mt-1 text-xs text-zinc-500">{whatsappMetrics.messagesRead} read by users</p>
            </div>

            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
              <p className="text-xs text-zinc-400 font-medium">Failed Deliveries</p>
              <p className="mt-2 text-2xl font-bold text-rose-400">{whatsappMetrics.messagesFailed}</p>
              <p className="mt-1 text-xs text-zinc-500">{whatsappMetrics.invalidSignatureCount} bad webhook sigs</p>
            </div>
          </div>

          {/* WhatsApp Template Registry */}
          <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Registered WhatsApp Alert Templates</h3>
              <span className="text-xs text-zinc-400">8 Canonical Categories</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[rgba(255,255,255,0.02)] text-zinc-400 uppercase">
                  <tr>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Template Key</th>
                    <th className="px-5 py-3">Meta Template Name</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-zinc-300 font-mono">
                  {whatsappMetrics.templateRegistry.map((t) => (
                    <tr key={t.templateKey} className="hover:bg-[rgba(255,255,255,0.02)]">
                      <td className="px-5 py-3 text-white font-sans font-medium">{t.category}</td>
                      <td className="px-5 py-3 text-[#B8F25C]">{t.templateKey}</td>
                      <td className="px-5 py-3">{t.providerTemplateName}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Failed Deliveries & Safe Retry */}
          {whatsappMetrics.recentFailures.length > 0 && (
            <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
              <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" /> Failed WhatsApp Deliveries (Safe Retry)
                </h3>
                <span className="text-xs text-zinc-400">Strict STOP Consent & RBAC Recheck</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[rgba(255,255,255,0.02)] text-zinc-400 uppercase">
                    <tr>
                      <th className="px-5 py-3">Failed At</th>
                      <th className="px-5 py-3">Template</th>
                      <th className="px-5 py-3">Error Code</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-zinc-300 font-mono">
                    {whatsappMetrics.recentFailures.map((del) => (
                      <tr key={del.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="px-5 py-3 text-zinc-400">{del.failedAt ? new Date(del.failedAt).toLocaleString() : '—'}</td>
                        <td className="px-5 py-3 text-white">{del.templateKey || 'text_message'}</td>
                        <td className="px-5 py-3 text-rose-400">{del.errorCode}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedDeliveryId(del.id);
                              setModalType('whatsapp_retry');
                              setAuditReason('');
                            }}
                            className="px-3 py-1 bg-[#B8F25C] text-black font-sans font-semibold rounded hover:bg-[#a6dc4f] transition-colors"
                          >
                            Retry Send
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: FEATURE CONTROLS & AUDIT */}
      {activeTab === 'controls' && (
        <div className="space-y-6">
          <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Power className="h-5 w-5 text-[#B8F25C]" /> Operational Feature Controls & Kill Switches
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Enables instantaneous emergency shutdown of intelligence features with mandatory audit reason logging.
                </p>
              </div>
            </div>
            <div className="divide-y divide-[rgba(255,255,255,0.04)]">
              {controls.map((c) => (
                <div key={c.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white font-mono">{c.featureKey}</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        c.enabled
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {c.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{c.description}</p>
                    {c.updatedReason && (
                      <p className="text-[11px] text-zinc-500 italic">
                        Last change: &ldquo;{c.updatedReason}&rdquo; ({new Date(c.updatedAt).toLocaleString()})
                      </p>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        setSelectedControl(c);
                        setModalType('control');
                        setAuditReason('');
                      }}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                        c.enabled
                          ? 'bg-rose-900/40 text-rose-300 border border-rose-700 hover:bg-rose-900/60'
                          : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700 hover:bg-emerald-900/60'
                      }`}
                    >
                      {c.enabled ? 'Emergency Disable' : 'Re-Enable Feature'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION / AUDIT REASON MODAL */}
      {modalType && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A1C16] border border-[rgba(255,255,255,0.15)] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#B8F25C]" /> Mandatory Audit Confirmation
              </h3>
              <button onClick={() => setModalType(null)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="text-xs text-zinc-300 space-y-2">
              {modalType === 'control' && selectedControl && (
                <p>
                  You are about to <strong className="text-white">{selectedControl.enabled ? 'DISABLE' : 'ENABLE'}</strong> platform feature control <code className="text-[#B8F25C]">{selectedControl.featureKey}</code>.
                </p>
              )}
              {modalType === 'job_retry' && (
                <p>
                  You are about to trigger a safe retry for failed background job <code className="text-[#B8F25C]">{selectedJobId}</code>.
                </p>
              )}
              {modalType === 'whatsapp_retry' && (
                <p>
                  You are about to trigger a safe retry for failed WhatsApp delivery <code className="text-[#B8F25C]">{selectedDeliveryId}</code>.
                </p>
              )}
              <p className="text-zinc-400">
                Please provide an explicit reason for this action. This will be recorded permanently in the platform audit log.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Audit Reason (min 3 characters):</label>
              <textarea
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                placeholder="e.g., Investigating upstream provider degradation..."
                rows={3}
                className="w-full bg-[#07130F] border border-[rgba(255,255,255,0.12)] rounded-lg p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#B8F25C]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[rgba(255,255,255,0.05)] text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction || auditReason.trim().length < 3}
                onClick={() => {
                  if (modalType === 'control') handleControlSubmit();
                  else if (modalType === 'job_retry') handleJobRetrySubmit();
                  else if (modalType === 'whatsapp_retry') handleWhatsAppRetrySubmit();
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#B8F25C] text-black hover:bg-[#a6dc4f] disabled:opacity-50 transition-colors"
              >
                {isSubmittingAction ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
