"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Play,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  Activity,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type {
  BusinessAutomation,
  IntelligenceJobRun,
  BusinessAttentionEvent,
  AutomationType,
  AutomationFrequency,
} from '@nnoo/contracts';

interface AutomationsDashboardProps {
  businessId: string;
  businessSlug: string;
  userRole: string;
  currencyCode?: string;
}

export function AutomationsDashboard({
  businessId,
  businessSlug,
  userRole,
  currencyCode = 'NGN',
}: AutomationsDashboardProps) {
  const [automations, setAutomations] = useState<BusinessAutomation[]>([]);
  const [runs, setRuns] = useState<IntelligenceJobRun[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [attentionEvents, setAttentionEvents] = useState<BusinessAttentionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [runningType, setRunningType] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManage = ['owner', 'business_admin', 'manager', 'accountant'].includes(userRole);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [autoRes, runsRes, attRes] = await Promise.all([
        fetch(`/api/v1/ai/automations?businessId=${businessId}`),
        fetch(`/api/v1/ai/automations/history?businessId=${businessId}&limit=20`),
        fetch(`/api/v1/ai/automations/attention?businessId=${businessId}&status=active`),
      ]);

      const [autoData, runsData, attData] = await Promise.all([
        autoRes.json(),
        runsRes.json(),
        attRes.json(),
      ]);

      if (autoData.success) {
        setAutomations(autoData.data.automations || []);
      }
      if (runsData.success) {
        setRuns(runsData.data.runs || []);
        setTotalRuns(runsData.data.total || 0);
      }
      if (attData.success) {
        setAttentionEvents(attData.data.events || []);
      }
    } catch (err: any) {
      console.error('Failed to load automations data:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async (
    type: AutomationType,
    updates: Partial<{
      enabled: boolean;
      frequency: AutomationFrequency;
      scheduleLocalTime: string;
      scheduleWeekday: number | null;
      scheduleMonthday: number | null;
    }>
  ) => {
    const current = automations.find((a) => a.automationType === type);
    if (!current) return;

    const payload = {
      businessId,
      automationType: type,
      enabled: updates.enabled !== undefined ? updates.enabled : current.enabled,
      frequency: updates.frequency !== undefined ? updates.frequency : current.frequency,
      scheduleLocalTime: updates.scheduleLocalTime ?? current.scheduleLocalTime,
      scheduleWeekday: updates.scheduleWeekday !== undefined ? updates.scheduleWeekday : current.scheduleWeekday,
      scheduleMonthday: updates.scheduleMonthday !== undefined ? updates.scheduleMonthday : current.scheduleMonthday,
    };

    setSavingType(type);
    setActionMessage(null);

    try {
      const res = await fetch('/api/v1/ai/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.data.automation) {
        setAutomations((prev) =>
          prev.map((a) => (a.automationType === type ? data.data.automation : a))
        );
        setActionMessage({ type: 'success', text: `Preferences updated for ${formatTypeLabel(type)}.` });
      } else {
        setActionMessage({ type: 'error', text: data.error?.message || 'Failed to update preferences.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Network error while updating preferences.' });
    } finally {
      setSavingType(null);
    }
  };

  const handleRunNow = async (type: AutomationType) => {
    setRunningType(type);
    setActionMessage(null);

    try {
      const res = await fetch('/api/v1/ai/automations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          automationType: type,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setActionMessage({
          type: 'success',
          text: `Executed ${formatTypeLabel(type)} successfully (${data.data.resultType || data.data.status}).`,
        });
        await fetchData();
      } else {
        setActionMessage({ type: 'error', text: data.error?.message || 'Run failed.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Network error during execution.' });
    } finally {
      setRunningType(null);
    }
  };

  const formatTypeLabel = (type: AutomationType) => {
    switch (type) {
      case 'business_summary':
        return 'Verified Business Summary';
      case 'health_score_refresh':
        return 'Business Health Score Refresh';
      case 'attention_scan':
        return 'Attention Condition Scanner';
      default:
        return type;
    }
  };

  const formatRunType = (jobType: string) => {
    return jobType
      .replace(/^(scheduled|manual)_/, '')
      .replace(/_/g, ' ')
      .toUpperCase();
  };

  if (loading && automations.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="h-64 bg-white/5 rounded-xl"></div>
            <div className="h-64 bg-white/5 rounded-xl"></div>
            <div className="h-64 bg-white/5 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Intelligence Automations
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                Background scheduling, deterministic condition monitoring, and verifiable business intelligence.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-neutral-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Timezone: <span className="font-semibold text-white">Africa/Lagos (WAT)</span>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="p-2 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-lg border border-white/10 transition-colors"
            title="Refresh"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3 Main Automation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Verified Business Summary */}
        {(() => {
          const auto = automations.find((a) => a.automationType === 'business_summary');
          const isEnabled = auto?.enabled ?? false;
          const freq = auto?.frequency ?? 'off';
          const isSaving = savingType === 'business_summary';
          const isRunning = runningType === 'business_summary';

          return (
            <div className="bg-[#0D241C] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      disabled={!canManage || isSaving}
                      onChange={(e) =>
                        handleUpdate('business_summary', {
                          enabled: e.target.checked,
                          frequency: e.target.checked && freq === 'off' ? 'daily' : freq,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">Business Summary</h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Scheduled verified summaries from accounting facts. Skips AI provider when facts are unchanged.
                  </p>
                </div>

                <div className="pt-2 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-400 block mb-1.5">Frequency</label>
                    <select
                      value={freq}
                      disabled={!canManage || isSaving || !isEnabled}
                      onChange={(e) =>
                        handleUpdate('business_summary', {
                          frequency: e.target.value as AutomationFrequency,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="off" className="bg-[#0A1C16]">Off (Manual Only)</option>
                      <option value="daily" className="bg-[#0A1C16]">Daily</option>
                      <option value="weekly" className="bg-[#0A1C16]">Weekly</option>
                      <option value="monthly" className="bg-[#0A1C16]">Monthly</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-neutral-400 block mb-1.5">Local Time</label>
                      <input
                        type="time"
                        value={auto?.scheduleLocalTime || '08:00'}
                        disabled={!canManage || isSaving || !isEnabled}
                        onChange={(e) =>
                          handleUpdate('business_summary', { scheduleLocalTime: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                    </div>

                    {freq === 'weekly' && (
                      <div>
                        <label className="text-xs font-medium text-neutral-400 block mb-1.5">Day of Week</label>
                        <select
                          value={auto?.scheduleWeekday ?? 1}
                          disabled={!canManage || isSaving || !isEnabled}
                          onChange={(e) =>
                            handleUpdate('business_summary', { scheduleWeekday: parseInt(e.target.value, 10) })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        >
                          <option value="1" className="bg-[#0A1C16]">Monday</option>
                          <option value="2" className="bg-[#0A1C16]">Tuesday</option>
                          <option value="3" className="bg-[#0A1C16]">Wednesday</option>
                          <option value="4" className="bg-[#0A1C16]">Thursday</option>
                          <option value="5" className="bg-[#0A1C16]">Friday</option>
                          <option value="6" className="bg-[#0A1C16]">Saturday</option>
                          <option value="7" className="bg-[#0A1C16]">Sunday</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">
                  Status: {isEnabled ? <span className="text-emerald-400 font-medium">Active</span> : <span className="text-neutral-500">Disabled</span>}
                </span>
                <button
                  onClick={() => handleRunNow('business_summary')}
                  disabled={!canManage || isRunning}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isRunning ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  Run Now
                </button>
              </div>
            </div>
          );
        })()}

        {/* 2. Business Health Score Refresh */}
        {(() => {
          const auto = automations.find((a) => a.automationType === 'health_score_refresh');
          const isEnabled = auto?.enabled ?? false;
          const freq = auto?.frequency ?? 'off';
          const isSaving = savingType === 'health_score_refresh';
          const isRunning = runningType === 'health_score_refresh';

          return (
            <div className="bg-[#0D241C] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      disabled={!canManage || isSaving}
                      onChange={(e) =>
                        handleUpdate('health_score_refresh', {
                          enabled: e.target.checked,
                          frequency: e.target.checked && freq === 'off' ? 'daily' : freq,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">Health Score Refresh</h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Deterministic score calculation across 5 dimensions. 100% TypeScript logic, 0 Gemini calls.
                  </p>
                </div>

                <div className="pt-2 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-400 block mb-1.5">Frequency</label>
                    <select
                      value={freq}
                      disabled={!canManage || isSaving || !isEnabled}
                      onChange={(e) =>
                        handleUpdate('health_score_refresh', {
                          frequency: e.target.value as AutomationFrequency,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="off" className="bg-[#0A1C16]">Off (Manual Only)</option>
                      <option value="daily" className="bg-[#0A1C16]">Daily</option>
                      <option value="weekly" className="bg-[#0A1C16]">Weekly</option>
                      <option value="monthly" className="bg-[#0A1C16]">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-400 block mb-1.5">Local Time</label>
                    <input
                      type="time"
                      value={auto?.scheduleLocalTime || '08:00'}
                      disabled={!canManage || isSaving || !isEnabled}
                      onChange={(e) =>
                        handleUpdate('health_score_refresh', { scheduleLocalTime: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">
                  Status: {isEnabled ? <span className="text-emerald-400 font-medium">Active</span> : <span className="text-neutral-500">Disabled</span>}
                </span>
                <button
                  onClick={() => handleRunNow('health_score_refresh')}
                  disabled={!canManage || isRunning}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isRunning ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  Refresh Now
                </button>
              </div>
            </div>
          );
        })()}

        {/* 3. Attention Scanner */}
        {(() => {
          const auto = automations.find((a) => a.automationType === 'attention_scan');
          const isEnabled = auto?.enabled ?? false;
          const freq = auto?.frequency ?? 'off';
          const isSaving = savingType === 'attention_scan';
          const isRunning = runningType === 'attention_scan';

          return (
            <div className="bg-[#0D241C] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      disabled={!canManage || isSaving}
                      onChange={(e) =>
                        handleUpdate('attention_scan', {
                          enabled: e.target.checked,
                          frequency: e.target.checked && freq === 'off' ? 'daily' : freq,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">Attention Condition Scanner</h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Scans inventory thresholds, overdue invoices, and pending reviews. Auto-resolves cleared conditions.
                  </p>
                </div>

                <div className="pt-2 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-400 block mb-1.5">Frequency</label>
                    <select
                      value={freq}
                      disabled={!canManage || isSaving || !isEnabled}
                      onChange={(e) =>
                        handleUpdate('attention_scan', {
                          frequency: e.target.value as AutomationFrequency,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    >
                      <option value="off" className="bg-[#0A1C16]">Off (Manual Only)</option>
                      <option value="daily" className="bg-[#0A1C16]">Daily</option>
                      <option value="weekly" className="bg-[#0A1C16]">Weekly</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-400 block mb-1.5">Local Time</label>
                    <input
                      type="time"
                      value={auto?.scheduleLocalTime || '08:00'}
                      disabled={!canManage || isSaving || !isEnabled}
                      onChange={(e) =>
                        handleUpdate('attention_scan', { scheduleLocalTime: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">
                  Status: {isEnabled ? <span className="text-amber-400 font-medium">Active</span> : <span className="text-neutral-500">Disabled</span>}
                </span>
                <button
                  onClick={() => handleRunNow('attention_scan')}
                  disabled={!canManage || isRunning}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isRunning ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  Scan Now
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Active Attention Conditions Section */}
      <div className="bg-[#0D241C] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Active Operational Attention Signals</h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 font-medium">
            {attentionEvents.length} Active Condition{attentionEvents.length === 1 ? '' : 's'}
          </span>
        </div>

        {attentionEvents.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm text-neutral-300 font-medium">All Clear</p>
            <p className="text-xs text-neutral-500 mt-1">
              No low stock, overdue invoices, or pending bookkeeping reviews currently detected.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attentionEvents.map((evt) => {
              const isImportant = evt.severity === 'important';
              const isAttention = evt.severity === 'attention';

              return (
                <div
                  key={evt.id}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                    isImportant
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      : isAttention
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isImportant
                            ? 'bg-rose-500/20 text-rose-300'
                            : isAttention
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {evt.severity}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {evt.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300">
                      {evt.type === 'LOW_STOCK_PRESENT' && Boolean(evt.metadata?.itemName) && (
                        <span>
                          {String(evt.metadata?.itemName)} is low on stock ({String(evt.metadata?.onHandQuantity)} remaining, threshold {String(evt.metadata?.threshold)}).
                        </span>
                      )}
                      {evt.type === 'OUT_OF_STOCK_PRESENT' && Boolean(evt.metadata?.itemName) && (
                        <span>
                          {String(evt.metadata?.itemName)} is completely OUT of stock (0 units).
                        </span>
                      )}
                      {evt.type === 'OVERDUE_INVOICES_PRESENT' && Boolean(evt.metadata?.invoiceNumber) && (
                        <span>
                          Invoice #{String(evt.metadata?.invoiceNumber)} is overdue by {String(evt.metadata?.daysOverdue)} days.
                        </span>
                      )}
                      {evt.type === 'BOOKKEEPER_REVIEW_PENDING' && (
                        <span>
                          {String(evt.metadata?.pendingCount || 1)} AI Bookkeeper transaction classification(s) await confirmation.
                        </span>
                      )}
                      {evt.type === 'CREDIT_PASSPORT_STALE' && (
                        <span>
                          Credit Passport snapshot is {String(evt.metadata?.ageDays || 30)}+ days old.
                        </span>
                      )}
                    </p>

                    <div className="text-[10px] text-neutral-400 pt-1">
                      First detected: {new Date(evt.firstDetectedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Execution Run History */}
      <div className="bg-[#0D241C] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Execution Run History</h2>
          </div>
          <span className="text-xs text-neutral-400">
            Total {totalRuns} execution{totalRuns === 1 ? '' : 's'}
          </span>
        </div>

        {runs.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
            <p className="text-xs text-neutral-400">No background runs executed yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="border-b border-white/10 text-neutral-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">Job Type</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Started At</th>
                  <th className="py-3 px-3">Result / Skip Reason</th>
                  <th className="py-3 px-3">Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {runs.map((run) => {
                  const isSuccess = run.status === 'succeeded';
                  const isSkipped = run.status === 'skipped';
                  const isFailed = run.status === 'failed';

                  return (
                    <tr key={run.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-sans font-medium text-white">
                        {formatRunType(run.jobType)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                            isSuccess
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isSkipped
                              ? 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                              : isFailed
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {run.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-400">
                        {new Date(run.startedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-neutral-300">
                        {run.resultType ? (
                          <span className="text-emerald-300 font-sans">{run.resultType.replace(/_/g, ' ')}</span>
                        ) : run.skipReason ? (
                          <span className="text-neutral-400 font-sans">{run.skipReason}</span>
                        ) : run.errorCode ? (
                          <span className="text-rose-400 font-sans">{run.errorCode}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 text-neutral-400">{run.attemptCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
