'use client';

import React, { useState, useEffect } from 'react';
import type { WhatsAppConnectionSummary, CreateWhatsAppLinkResult, NotificationCategory } from '@nnoo/contracts';

interface WhatsAppSettingsProps {
  businessId: string;
  businessSlug: string;
}

const CATEGORY_LABELS: Record<NotificationCategory, { title: string; desc: string }> = {
  INVENTORY: { title: 'Inventory & Stock Alerts', desc: 'Low stock and out-of-stock warnings' },
  INVOICES: { title: 'Invoice & Receivables', desc: 'Overdue customer invoice alerts' },
  BOOKKEEPER: { title: 'AI Bookkeeper Reviews', desc: 'Pending transactions requiring human confirmation' },
  BUSINESS_HEALTH: { title: 'Business Health Score', desc: 'Significant score changes and recommendations' },
  CREDIT_PASSPORT: { title: 'Credit Passport Updates', desc: 'Verified profile refresh and stale alerts' },
  BUSINESS_SUMMARIES: { title: 'Business Performance Summaries', desc: 'Weekly and monthly executive briefings' },
  AUTOMATIONS: { title: 'Automations & Background Jobs', desc: 'Failed scheduled background job alerts' },
};

export function WhatsAppSettings({ businessId, businessSlug }: WhatsAppSettingsProps) {
  const [summary, setSummary] = useState<WhatsAppConnectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkData, setLinkData] = useState<CreateWhatsAppLinkResult | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [preferences, setPreferences] = useState<Record<NotificationCategory, boolean>>({
    INVENTORY: true,
    INVOICES: true,
    BOOKKEEPER: true,
    BUSINESS_HEALTH: true,
    CREDIT_PASSPORT: true,
    BUSINESS_SUMMARIES: true,
    AUTOMATIONS: true,
  });

  const fetchConnection = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/ai/whatsapp/link?businessId=${businessId}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load connection status' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch(`/api/v1/ai/notifications/preferences?businessId=${businessId}`);
      const data = await res.json();
      if (data.success && data.data?.preferences) {
        const nextPrefs = { ...preferences };
        for (const p of data.data.preferences) {
          if (p.channel === 'WHATSAPP') {
            nextPrefs[p.category as NotificationCategory] = p.enabled;
          }
        }
        setPreferences(nextPrefs);
      }
    } catch {
      // Use defaults
    }
  };

  useEffect(() => {
    fetchConnection();
    fetchPreferences();
  }, [businessId]);

  const handleGenerateLink = async () => {
    try {
      setGeneratingLink(true);
      setFeedback(null);
      const res = await fetch('/api/v1/ai/whatsapp/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      if (data.success) {
        setLinkData(data.data);
      } else {
        setFeedback({ type: 'error', message: data.error?.message || 'Failed to generate link code' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to generate link code' });
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp for this business? Outbound alerts and inbound queries will stop.')) {
      return;
    }

    try {
      setDisconnecting(true);
      setFeedback(null);
      const res = await fetch('/api/v1/ai/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'WhatsApp disconnected successfully.' });
        fetchConnection();
      } else {
        setFeedback({ type: 'error', message: data.error?.message || 'Failed to disconnect WhatsApp' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to disconnect WhatsApp' });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSwitchBusiness = async (targetBusinessId: string) => {
    try {
      setSwitching(true);
      setFeedback(null);
      const res = await fetch('/api/v1/ai/whatsapp/switch-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetBusinessId }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Active business context switched to ${data.data?.businessName}.` });
        fetchConnection();
      } else {
        setFeedback({ type: 'error', message: data.error?.message || 'Failed to switch active business' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to switch active business' });
    } finally {
      setSwitching(false);
    }
  };

  const handleSendTestMessage = async () => {
    try {
      setSendingTest(true);
      setFeedback(null);
      const res = await fetch('/api/v1/ai/whatsapp/test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Test message sent to your WhatsApp number!' });
      } else {
        setFeedback({ type: 'error', message: data.error?.message || 'Failed to send test message' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to send test message' });
    } finally {
      setSendingTest(false);
    }
  };

  const handleTogglePreference = async (category: NotificationCategory) => {
    const nextVal = !preferences[category];
    setPreferences((prev) => ({ ...prev, [category]: nextVal }));

    try {
      await fetch(`/api/v1/ai/notifications/preferences?businessId=${businessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          channel: 'WHATSAPP',
          enabled: nextVal,
        }),
      });
    } catch {
      // Revert on failure
      setPreferences((prev) => ({ ...prev, [category]: !nextVal }));
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3" />
        Loading WhatsApp integration settings...
      </div>
    );
  }

  const isConnected = summary?.isConnected;
  const isOptedOut = summary?.status === 'OPTED_OUT';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <span className="text-emerald-400">💬</span> WhatsApp Business Integration
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Receive real-time verified business alerts and query your company metrics securely over WhatsApp.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/50 border border-rose-800 text-rose-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Main Connection Card */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl">
              📱
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-zinc-100">Meta WhatsApp Business API</h2>
                {isConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </span>
                ) : isOptedOut ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Opted Out (Paused)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {isConnected
                  ? `Linked number: ${summary?.maskedPhone || 'Connected'} • Active: ${summary?.activeBusinessName || 'This business'}`
                  : 'Link your personal or work WhatsApp number to interact with NNOO.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isConnected ? (
              <button
                onClick={handleGenerateLink}
                disabled={generatingLink}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-emerald-950/50 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {generatingLink ? 'Generating Code...' : '🔗 Connect WhatsApp'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSendTestMessage}
                  disabled={sendingTest}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition border border-zinc-700 disabled:opacity-50 cursor-pointer"
                >
                  {sendingTest ? 'Sending...' : '📨 Send Test Alert'}
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 rounded-lg text-xs font-medium transition border border-rose-800/40 disabled:opacity-50 cursor-pointer"
                >
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Link Modal / Code Card */}
        {linkData && !isConnected && (
          <div className="mt-6 p-6 bg-zinc-950 border border-emerald-800/40 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                <span>🔐</span> One-Time Verification Code
              </h3>
              <span className="text-xs text-zinc-400">Valid for 10 minutes</span>
            </div>

            <p className="text-xs text-zinc-400">
              Send the verification code below to NNOO&apos;s WhatsApp number to securely link your account.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 flex items-center justify-between px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                <span className="text-xl font-mono font-bold tracking-wider text-emerald-400">
                  CONNECT {linkData.code}
                </span>
                <button
                  onClick={() => copyCode(`CONNECT ${linkData.code}`)}
                  className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              <a
                href={linkData.clickToChatUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
              >
                <span>💬</span> Open WhatsApp Chat
              </a>
            </div>
          </div>
        )}

        {/* Multi-business switching */}
        {isConnected && summary?.availableBusinesses && summary.availableBusinesses.length > 1 && (
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Active WhatsApp Context</h3>
            <p className="text-xs text-zinc-400 mb-4">
              When you message NNOO on WhatsApp, responses reflect your active business. Switch context below or type <code className="text-emerald-400 bg-zinc-800 px-1 py-0.5 rounded font-mono">BUSINESS</code> in WhatsApp.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary.availableBusinesses.map((b) => (
                <button
                  key={b.id}
                  onClick={() => !b.isActive && handleSwitchBusiness(b.id)}
                  disabled={switching || b.isActive}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    b.isActive
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                      : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm">{b.name}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">Role: {b.role}</div>
                  </div>
                  {b.isActive ? (
                    <span className="text-xs font-semibold text-emerald-400">✓ Active Context</span>
                  ) : (
                    <span className="text-xs text-zinc-400">Switch</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Notification Preferences */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">WhatsApp Alert Preferences</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Choose which types of business alerts are delivered directly to your WhatsApp.
          </p>
        </div>

        <div className="divide-y divide-zinc-800">
          {(Object.keys(CATEGORY_LABELS) as NotificationCategory[]).map((cat) => {
            const label = CATEGORY_LABELS[cat];
            const enabled = preferences[cat] ?? true;

            return (
              <div key={cat} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-medium text-zinc-200">{label.title}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{label.desc}</p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => handleTogglePreference(cat)}
                    disabled={!isConnected}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-disabled:opacity-40"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Invariants Explainer */}
      <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <span>🛡️</span> Security & Financial Integrity Controls
        </h3>
        <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
          <li><strong className="text-zinc-300">Read-Only Channel:</strong> WhatsApp can never create or modify financial transactions, stock levels, or invoice statuses.</li>
          <li><strong className="text-zinc-300">Role-Based Access:</strong> Responses strictly respect your assigned permissions (e.g. Sales staff cannot view business profitability).</li>
          <li><strong className="text-zinc-300">Verified Facts:</strong> All financial answers are computed directly from verified database records.</li>
          <li><strong className="text-zinc-300">Lock-Screen Privacy:</strong> Outbound notifications are formatted to avoid exposing sensitive balances on device lock screens.</li>
        </ul>
      </div>
    </div>
  );
}
