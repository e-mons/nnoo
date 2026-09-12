'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Bell, CheckCheck, ExternalLink, Package, FileText, Sparkles, Activity, FileBadge, Clock, TrendingUp } from 'lucide-react';
import { useBusiness } from '@/components/providers/BusinessProvider';
import { BusinessNotification, NotificationCategory } from '@nnoo/contracts/ai';
import { ACTION_ROUTE_MAP } from '@/server/ai/notifications/policy-registry';

const CATEGORY_ICON_MAP: Record<NotificationCategory, React.ComponentType<{ className?: string }>> = {
  INVENTORY: Package,
  INVOICES: FileText,
  BOOKKEEPER: Sparkles,
  BUSINESS_HEALTH: Activity,
  CREDIT_PASSPORT: FileBadge,
  BUSINESS_SUMMARIES: TrendingUp,
  AUTOMATIONS: Clock,
};

export function NotificationBell() {
  const { activeBusiness } = useBusiness();
  const params = useParams();
  const router = useRouter();
  const businessSlug = (params?.businessSlug as string) || activeBusiness?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'business';

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<BusinessNotification[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeBusinessId = activeBusiness?.id;

  const fetchUnreadCount = useCallback(async () => {
    if (!activeBusinessId) return;
    try {
      const res = await fetch(`/api/v1/ai/notifications/unread-count?businessId=${activeBusinessId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.data?.unreadCount === 'number') {
          setUnreadCount(data.data.unreadCount);
        }
      }
    } catch {
      // Ignore network errors in background poll
    }
  }, [activeBusinessId]);

  const fetchPreviewNotifications = useCallback(async () => {
    if (!activeBusinessId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/ai/notifications?businessId=${activeBusinessId}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data?.notifications)) {
          setNotifications(data.data.notifications);
          if (typeof data.data?.totalUnreadCount === 'number') {
            setUnreadCount(data.data.totalUnreadCount);
          }
        }
      }
    } catch {
      // Ignore preview fetch errors
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    fetchUnreadCount();
    // Poll unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Refetch preview when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchPreviewNotifications();
    }
  }, [isOpen, fetchPreviewNotifications]);

  // Outside click listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeBusiness?.id) return;
    try {
      await fetch(`/api/v1/ai/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: activeBusiness.id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore mark-read error
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!activeBusiness?.id) return;
    try {
      await fetch('/api/v1/ai/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: activeBusiness.id }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // Ignore mark-all-read error
    }
  };

  const handleActionClick = (notification: BusinessNotification) => {
    handleMarkAsRead(notification.id);
    setIsOpen(false);
    const routeResolver = ACTION_ROUTE_MAP[notification.primaryActionKey];
    if (routeResolver) {
      router.push(routeResolver(businessSlug));
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-white/80 hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-all border border-white/10"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-[#0A1C16] bg-[#B8F25C] rounded-full shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#0d241c] border border-white/15 shadow-2xl z-50 overflow-hidden flex flex-col text-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0A1C16]/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#B8F25C]/20 text-[#B8F25C] border border-[#B8F25C]/30">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-white/60 hover:text-[#B8F25C] flex items-center gap-1 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
            {loading ? (
              <div className="py-8 text-center text-xs text-white/50">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs text-white/60 font-medium">You&apos;re all caught up</p>
                <p className="text-[11px] text-white/40 mt-0.5">No new notifications for this business</p>
              </div>
            ) : (
              notifications.map((n) => {
                const IconComponent = CATEGORY_ICON_MAP[n.notificationCategory] || Bell;
                const isUnread = !n.readAt;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleActionClick(n)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-white/5 cursor-pointer transition-colors ${
                      isUnread ? 'bg-white/[0.03]' : ''
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isUnread
                          ? 'bg-[#B8F25C]/10 text-[#B8F25C] border border-[#B8F25C]/20'
                          : 'bg-white/5 text-white/50 border border-white/10'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-semibold truncate ${isUnread ? 'text-white' : 'text-white/70'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-white/40 whitespace-nowrap shrink-0">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 line-clamp-2 mt-0.5">{n.body}</p>
                    </div>

                    {isUnread && (
                      <span
                        className="w-2 h-2 rounded-full bg-[#B8F25C] shrink-0 mt-1.5"
                        title="Unread"
                        aria-label="Unread notification"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-white/10 bg-[#0A1C16]/80 text-center">
            <Link
              href={`/app/${businessSlug}/notifications`}
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-[#B8F25C] hover:underline flex items-center justify-center gap-1.5 py-1"
            >
              <span>View all notifications & attention</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
