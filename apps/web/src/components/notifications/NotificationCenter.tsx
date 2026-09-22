'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  CheckCheck,
  Package,
  FileText,
  Sparkles,
  Activity,
  FileBadge,
  Clock,
  TrendingUp,
  Sliders,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  BusinessNotification,
  BusinessAttentionItem,
  NotificationCategory,
  NotificationPreference,
} from '@nnoo/contracts/ai';
import { ACTION_ROUTE_MAP } from '@/server/ai/notifications/policy-registry';

const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; description: string }
> = {
  INVENTORY: {
    label: 'Inventory',
    icon: Package,
    description: 'Alerts when stock levels drop below reorder thresholds or products run out.',
  },
  INVOICES: {
    label: 'Invoices & Receivables',
    icon: FileText,
    description: 'Alerts for unpaid customer invoices that have passed their due dates.',
  },
  BOOKKEEPER: {
    label: 'AI Bookkeeper',
    icon: Sparkles,
    description: 'Notifications when new transactions require human review and confirmation.',
  },
  BUSINESS_HEALTH: {
    label: 'Business Health',
    icon: Activity,
    description: 'Updates when your deterministic business health score status changes.',
  },
  CREDIT_PASSPORT: {
    label: 'Credit Passport',
    icon: FileBadge,
    description: 'Alerts when business records change and your Credit Passport needs review.',
  },
  BUSINESS_SUMMARIES: {
    label: 'Business Summaries',
    icon: TrendingUp,
    description: 'Notifications when scheduled daily, weekly, or monthly summaries are ready.',
  },
  AUTOMATIONS: {
    label: 'Automations',
    icon: Clock,
    description: 'Alerts when scheduled business automations or scans encounter issues.',
  },
};

interface NotificationCenterProps {
  businessId: string;
  businessSlug: string;
}

export function NotificationCenter({ businessId, businessSlug }: NotificationCenterProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'attention' | 'preferences'>('all');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  // Data states
  const [notifications, setNotifications] = useState<BusinessNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [attentionItems, setAttentionItems] = useState<BusinessAttentionItem[]>([]);
  const [groupedAttention, setGroupedAttention] = useState<Record<string, BusinessAttentionItem[]>>({});
  const [totalActiveAttention, setTotalActiveAttention] = useState<number>(0);

  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);

  // Loading / Mutating states
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingPref, setUpdatingPref] = useState<string | null>(null);

  // Fetch notifications feed
  const loadNotifications = useCallback(
    async (cursor?: string | null, reset = false) => {
      try {
        setLoading(true);
        const url = `/api/v1/ai/notifications?businessId=${businessId}&limit=20${
          cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
        }${unreadOnly ? '&unreadOnly=true' : ''}`;

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setNotifications((prev) => (reset ? json.data.notifications : [...prev, ...json.data.notifications]));
            setUnreadCount(json.data.totalUnreadCount);
            setHasMore(json.data.hasMore);
            setNextCursor(json.data.nextCursor || null);
          }
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    },
    [businessId, unreadOnly]
  );

  // Fetch active attention conditions
  const loadAttention = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/ai/notifications/attention?businessId=${businessId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAttentionItems(json.data.items || []);
          setGroupedAttention(json.data.groupedByCategory || {});
          setTotalActiveAttention(json.data.totalActiveCount || 0);
        }
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Fetch preferences
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/ai/notifications/preferences?businessId=${businessId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.preferences) {
          setPreferences(json.data.preferences);
        }
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (activeTab === 'all') {
      loadNotifications(null, true);
    } else if (activeTab === 'attention') {
      loadAttention();
    } else if (activeTab === 'preferences') {
      loadPreferences();
    }
  }, [activeTab, loadNotifications, loadAttention, loadPreferences]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/v1/ai/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore error
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/v1/ai/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // Ignore error
    }
  };

  const handleTogglePreference = async (pref: NotificationPreference) => {
    const nextEnabled = !pref.enabled;
    setUpdatingPref(pref.category);

    // Optimistic UI update
    setPreferences((prev) =>
      prev.map((p) => (p.category === pref.category ? { ...p, enabled: nextEnabled } : p))
    );

    try {
      const res = await fetch(`/api/v1/ai/notifications/preferences?businessId=${businessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: pref.category,
          channel: 'IN_APP',
          enabled: nextEnabled,
        }),
      });
      if (!res.ok) {
        // Rollback on error
        setPreferences((prev) =>
          prev.map((p) => (p.category === pref.category ? { ...p, enabled: pref.enabled } : p))
        );
      }
    } catch {
      // Rollback on error
      setPreferences((prev) =>
        prev.map((p) => (p.category === pref.category ? { ...p, enabled: pref.enabled } : p))
      );
    } finally {
      setUpdatingPref(null);
    }
  };

  const handleActionNavigation = (primaryActionKey: string, notificationId?: string) => {
    if (notificationId) {
      handleMarkAsRead(notificationId);
    }
    const routeResolver = ACTION_ROUTE_MAP[primaryActionKey as keyof typeof ACTION_ROUTE_MAP];
    if (routeResolver) {
      router.push(routeResolver(businessSlug));
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-[#B8F25C]" />
            Notification & Attention Center
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Real-time business attention conditions, intelligence notifications, and personal delivery preferences.
          </p>
        </div>

        {activeTab === 'all' && unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white text-sm font-semibold border border-white/10 transition-colors shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-[#B8F25C]" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'all'
              ? 'border-[#B8F25C] text-[#B8F25C] bg-white/[0.03]'
              : 'border-transparent text-white/60 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <Bell className="w-4 h-4" />
          All Notifications
          {unreadCount > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-[#B8F25C] text-[#0A1C16] font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attention')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'attention'
              ? 'border-[#B8F25C] text-[#B8F25C] bg-white/[0.03]'
              : 'border-transparent text-white/60 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Needs Attention
          {totalActiveAttention > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-amber-400 text-[#0A1C16] font-bold">
              {totalActiveAttention}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'preferences'
              ? 'border-[#B8F25C] text-[#B8F25C] bg-white/[0.03]'
              : 'border-transparent text-white/60 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Delivery Preferences
        </button>
      </div>

      {/* Tab: All Notifications */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setUnreadOnly(false);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  !unreadOnly
                    ? 'bg-[#B8F25C]/20 text-[#B8F25C] border border-[#B8F25C]/30'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setUnreadOnly(true);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  unreadOnly
                    ? 'bg-[#B8F25C]/20 text-[#B8F25C] border border-[#B8F25C]/30'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                Unread only ({unreadCount})
              </button>
            </div>

            <button
              type="button"
              onClick={() => loadNotifications(null, true)}
              className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {notifications.length === 0 && !loading ? (
            <div className="py-16 text-center rounded-2xl bg-[#0d241c] border border-white/10 p-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#B8F25C]/10 text-[#B8F25C] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">You&apos;re all caught up</h3>
              <p className="text-sm text-white/60 mt-1 max-w-sm mx-auto">
                There are no {unreadOnly ? 'unread ' : ''}notifications waiting for your attention right now.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {notifications.map((n) => {
                const IconComponent = CATEGORY_META[n.notificationCategory]?.icon || Bell;
                const isUnread = !n.readAt;

                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isUnread
                        ? 'bg-[#0e271e] border-[#B8F25C]/30 shadow-lg'
                        : 'bg-[#0d241c] border-white/10 opacity-90'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                          isUnread
                            ? 'bg-[#B8F25C]/10 text-[#B8F25C] border border-[#B8F25C]/30'
                            : 'bg-white/5 text-white/50 border border-white/10'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-white/10 text-white/80">
                            {CATEGORY_META[n.notificationCategory]?.label || n.notificationCategory}
                          </span>
                          <span className="text-xs text-white/40" suppressHydrationWarning>{formatTime(n.createdAt)}</span>
                          {isUnread && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#B8F25C] text-[#0A1C16]">
                              NEW
                            </span>
                          )}
                        </div>

                        <h4 className={`text-sm font-semibold ${isUnread ? 'text-white' : 'text-white/80'}`}>
                          {n.title}
                        </h4>
                        <p className="text-xs text-white/70">{n.body}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(n.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                        >
                          Mark read
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleActionNavigation(n.primaryActionKey, n.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#B8F25C] text-[#0A1C16] hover:bg-[#a8e24c] transition-colors shadow-sm"
                      >
                        <span>Review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <div className="text-center pt-3">
                  <button
                    type="button"
                    onClick={() => loadNotifications(nextCursor)}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold text-white border border-white/10 transition-colors"
                  >
                    {loading ? 'Loading...' : 'Load more notifications'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Needs Attention */}
      {activeTab === 'attention' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-amber-300">Live Business Attention State</p>
              <p className="text-amber-200/80">
                These conditions represent actual unresolved operational items in your business. Marking individual personal notifications as read does not resolve the underlying business condition.
              </p>
            </div>
          </div>

          {attentionItems.length === 0 && !loading ? (
            <div className="py-16 text-center rounded-2xl bg-[#0d241c] border border-white/10 p-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#B8F25C]/10 text-[#B8F25C] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">All Clear</h3>
              <p className="text-sm text-white/60 mt-1 max-w-md mx-auto">
                Nothing currently needs your attention in the business areas you can access.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedAttention).map(([category, items]) => {
                if (!items || items.length === 0) return null;
                const catMeta = CATEGORY_META[category as NotificationCategory] || {
                  label: category,
                  icon: AlertCircle,
                };
                const IconComponent = catMeta.icon;

                return (
                  <div key={category} className="rounded-2xl bg-[#0d241c] border border-white/10 overflow-hidden">
                    <div className="px-5 py-3.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <IconComponent className="w-4 h-4 text-[#B8F25C]" />
                        <h3 className="text-sm font-bold text-white">{catMeta.label}</h3>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-white/10 text-white">
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    <div className="p-4 space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                                  item.severity === 'important'
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {item.severity}
                              </span>
                            </div>
                            <p className="text-xs text-white/70 mt-1">{item.description}</p>
                            <span className="text-[10px] text-white/40 mt-1 block">
                              First detected {formatTime(item.firstDetectedAt)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleActionNavigation(item.primaryActionKey)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#B8F25C] text-[#0A1C16] hover:bg-[#a8e24c] transition-colors shrink-0 self-end sm:self-center"
                          >
                            <span>Resolve in {catMeta.label}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Delivery Preferences */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-white/70">
            <p className="font-semibold text-white mb-1">In-App Notification Preferences</p>
            <p>
              Control which categories of notifications you receive in your personal inbox. Muting a category stops new inbox notifications from being generated for your account, but does not alter your underlying business permissions or the live Attention Center.
            </p>
          </div>

          <div className="rounded-2xl bg-[#0d241c] border border-white/10 divide-y divide-white/5">
            {preferences.map((pref) => {
              const meta = CATEGORY_META[pref.category];
              if (!meta) return null;
              const IconComponent = meta.icon;
              const isUpdating = updatingPref === pref.category;

              return (
                <div key={pref.category} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-white/5 text-[#B8F25C] border border-white/10 shrink-0 mt-0.5">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{meta.label}</h4>
                      <p className="text-xs text-white/60 mt-0.5 max-w-lg">{meta.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={pref.enabled}
                    disabled={isUpdating}
                    onClick={() => handleTogglePreference(pref)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      pref.enabled ? 'bg-[#B8F25C]' : 'bg-white/20'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#0A1C16] shadow ring-0 transition duration-200 ease-in-out ${
                        pref.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
