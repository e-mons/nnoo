import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@nnoo/supabase/database.types';
import {
  BusinessNotification,
  NotificationCategory,
  NotificationType,
  BusinessAttentionItem,
  BusinessAttentionSummary,
  NotificationPreference,
  NotificationChannel,
  NotificationFeedResponse,

  BusinessAttentionType,
} from '@nnoo/contracts/ai';
import { hasPermission, FeatureModule } from '@/lib/auth/rbac-client';
import {
  NOTIFICATION_POLICY_REGISTRY,
  NotificationPolicy,
  CATEGORY_FEATURE_MAP,
} from './policy-registry';
import { RecipientResolverService } from './recipient-resolver';

export interface ProcessAttentionEventResult {
  sourceEventId: string;
  notificationType: NotificationType;
  eligibleCount: number;
  createdCount: number;
}

export interface ProcessJobRunEventResult {
  jobRunId: string;
  notificationType?: NotificationType;
  eligibleCount: number;
  createdCount: number;
}

export class NotificationService {
  /**
   * Process a verified Prompt 8 BusinessAttentionEvent and fan out personal
   * notifications to eligible, permitted, opted-in business members.
   */
  static async processAttentionEvent(
    supabase: SupabaseClient<Database>,
    event: {
      id: string;
      business_id: string;
      type: string;
      category?: string;
      severity?: string;
      dedupe_key?: string;
      source_type?: string;
      source_reference?: string | null;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ProcessAttentionEventResult | null> {
    // 1. Map attention event type to notification policy
    const policy = Object.values(NOTIFICATION_POLICY_REGISTRY).find((p) =>
      p.sourceAttentionTypes?.includes(event.type as BusinessAttentionType)
    );

    if (!policy) {
      // Unknown or unmapped attention event -> ignore safely with 0 notifications
      return null;
    }

    // 2. Resolve eligible recipients
    const recipients = await RecipientResolverService.resolveRecipients(
      supabase,
      event.business_id,
      policy
    );

    if (recipients.length === 0) {
      return {
        sourceEventId: event.id,
        notificationType: policy.notificationType,
        eligibleCount: 0,
        createdCount: 0,
      };
    }

    // 3. Build notification rows with deterministic dedupe keys
    const title = policy.formatTitle(event.metadata || {});
    const body = policy.formatBody(event.metadata || {});
    const baseDedupe = event.dedupe_key || event.id;

    const rows = recipients.map((r) => ({
      business_id: event.business_id,
      recipient_user_id: r.userId,
      source_event_id: event.id,
      notification_category: policy.category,
      notification_type: policy.notificationType,
      dedupe_key: `${baseDedupe}:${r.userId}:${policy.notificationType}`,
      title,
      body,
      payload: {
        eventId: event.id,
        eventType: event.type,
        ...(event.metadata || {}),
      },
      primary_action_key: policy.primaryActionKey,
      source_reference_type: event.source_type || null,
      source_reference_id: event.source_reference || null,
      required_capabilities: policy.requiredCapabilities,
      channel: 'IN_APP' as const,
    }));

    // 4. Idempotent insert (ignore duplicates)
    const { data: inserted, error } = await supabase
      .from('business_notifications')
      .upsert(rows, {
        onConflict: 'business_id, recipient_user_id, dedupe_key',
        ignoreDuplicates: true,
      })
      .select('id');

    if (error) {
      throw new Error(`Failed to fan out notifications: ${error.message}`);
    }

    return {
      sourceEventId: event.id,
      notificationType: policy.notificationType,
      eligibleCount: recipients.length,
      createdCount: inserted ? inserted.length : 0,
    };
  }

  /**
   * Process an intelligence job run (e.g. scheduled summary ready)
   */
  static async processJobRunEvent(
    supabase: SupabaseClient<Database>,
    jobRun: {
      id: string;
      business_id: string;
      job_type: string;
      status: string;
      attempt_count?: number;
      result_id?: string | null;
      error_code?: string | null;
    }
  ): Promise<ProcessJobRunEventResult | null> {
    if (jobRun.job_type === 'business_summary' && jobRun.status === 'succeeded') {
      const policy = NOTIFICATION_POLICY_REGISTRY.BUSINESS_SUMMARY_READY;
      const recipients = await RecipientResolverService.resolveRecipients(
        supabase,
        jobRun.business_id,
        policy
      );

      if (recipients.length === 0) {
        return {
          jobRunId: jobRun.id,
          notificationType: policy.notificationType,
          eligibleCount: 0,
          createdCount: 0,
        };
      }

      const rows = recipients.map((r) => ({
        business_id: jobRun.business_id,
        recipient_user_id: r.userId,
        source_event_id: jobRun.id,
        notification_category: policy.category,
        notification_type: policy.notificationType,
        dedupe_key: `${jobRun.id}:${r.userId}:${policy.notificationType}`,
        title: policy.formatTitle({}),
        body: policy.formatBody({}),
        payload: {
          jobRunId: jobRun.id,
          summaryId: jobRun.result_id,
        },
        primary_action_key: policy.primaryActionKey,
        source_reference_type: 'business_summary',
        source_reference_id: jobRun.result_id || null,
        required_capabilities: policy.requiredCapabilities,
        channel: 'IN_APP' as const,
      }));

      const { data: inserted, error } = await supabase
        .from('business_notifications')
        .upsert(rows, {
          onConflict: 'business_id, recipient_user_id, dedupe_key',
          ignoreDuplicates: true,
        })
        .select('id');

      if (error) {
        throw new Error(`Failed to fan out summary notifications: ${error.message}`);
      }

      return {
        jobRunId: jobRun.id,
        notificationType: policy.notificationType,
        eligibleCount: recipients.length,
        createdCount: inserted ? inserted.length : 0,
      };
    }

    return null;
  }

  /**
   * Get paginated notifications for current user with current-permission rechecks
   */
  static async getNotifications(
    supabase: SupabaseClient<Database>,
    params: {
      businessId: string;
      userId: string;
      limit?: number;
      cursor?: string | null;
      unreadOnly?: boolean;
    }
  ): Promise<NotificationFeedResponse> {
    const limit = Math.min(Math.max(params.limit || 20, 1), 50);

    // 1. Get current active membership role
    const { data: membership, error: memErr } = await supabase
      .from('business_memberships')
      .select('role, membership_status')
      .eq('business_id', params.businessId)
      .eq('user_id', params.userId)
      .eq('membership_status', 'active')
      .maybeSingle();

    if (memErr || !membership) {
      return {
        notifications: [],
        totalUnreadCount: 0,
        hasMore: false,
      };
    }

    const currentRole = membership.role;

    // 2. Query personal notifications
    let query = supabase
      .from('business_notifications')
      .select('*')
      .eq('business_id', params.businessId)
      .eq('recipient_user_id', params.userId)
      .order('created_at', { ascending: false });

    if (params.unreadOnly) {
      query = query.is('read_at', null);
    }

    if (params.cursor) {
      query = query.lt('created_at', params.cursor);
    }

    // Fetch extra item to check hasMore
    const { data: rows, error } = await query.limit(limit + 1);

    if (error || !rows) {
      return {
        notifications: [],
        totalUnreadCount: 0,
        hasMore: false,
      };
    }

    // 3. Filter notifications by CURRENT permissions (Role Downgrade Protection)
    const permittedRows = rows.filter((r) => {
      const required = (r.required_capabilities || []) as FeatureModule[];
      return required.every((cap) => hasPermission(currentRole, cap));
    });

    const hasMore = permittedRows.length > limit;
    const paginatedItems = hasMore ? permittedRows.slice(0, limit) : permittedRows;

    const mappedNotifications: BusinessNotification[] = paginatedItems.map((r) => ({
      id: r.id,
      businessId: r.business_id,
      recipientUserId: r.recipient_user_id,
      sourceEventId: r.source_event_id,
      notificationCategory: r.notification_category as NotificationCategory,
      notificationType: r.notification_type as NotificationType,
      dedupeKey: r.dedupe_key,
      title: r.title,
      body: r.body,
      payload: (r.payload as Record<string, unknown>) || {},
      primaryActionKey: r.primary_action_key as any,
      sourceReferenceType: r.source_reference_type,
      sourceReferenceId: r.source_reference_id,
      requiredCapabilities: r.required_capabilities || [],
      channel: 'IN_APP',
      createdAt: r.created_at,
      readAt: r.read_at,
      resolvedAt: r.resolved_at,
    }));

    // 4. Calculate total unread count with current-permission filtering
    const totalUnreadCount = await this.getUnreadCount(supabase, {
      businessId: params.businessId,
      userId: params.userId,
    });

    const nextCursor =
      hasMore && mappedNotifications.length > 0
        ? mappedNotifications[mappedNotifications.length - 1].createdAt
        : null;

    return {
      notifications: mappedNotifications,
      totalUnreadCount,
      hasMore,
      nextCursor,
    };
  }

  /**
   * Get unread notification count with current-permission rechecks
   */
  static async getUnreadCount(
    supabase: SupabaseClient<Database>,
    params: {
      businessId: string;
      userId: string;
    }
  ): Promise<number> {
    const { data: membership } = await supabase
      .from('business_memberships')
      .select('role')
      .eq('business_id', params.businessId)
      .eq('user_id', params.userId)
      .eq('membership_status', 'active')
      .maybeSingle();

    if (!membership) return 0;
    const currentRole = membership.role;

    const { data: unreadRows } = await supabase
      .from('business_notifications')
      .select('required_capabilities')
      .eq('business_id', params.businessId)
      .eq('recipient_user_id', params.userId)
      .is('read_at', null);

    if (!unreadRows || unreadRows.length === 0) return 0;

    // Filter out rows where user no longer has capability (Role Downgrade Protection)
    const permittedCount = unreadRows.filter((r) => {
      const required = (r.required_capabilities || []) as FeatureModule[];
      return required.every((cap) => hasPermission(currentRole, cap));
    }).length;

    return permittedCount;
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(
    supabase: SupabaseClient<Database>,
    params: {
      businessId: string;
      userId: string;
      notificationId: string;
    }
  ): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('business_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', params.notificationId)
      .eq('business_id', params.businessId)
      .eq('recipient_user_id', params.userId);

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * Mark all notifications as read for current user and active business
   */
  static async markAllAsRead(
    supabase: SupabaseClient<Database>,
    params: {
      businessId: string;
      userId: string;
    }
  ): Promise<{ count: number }> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('business_notifications')
      .update({ read_at: now })
      .eq('business_id', params.businessId)
      .eq('recipient_user_id', params.userId)
      .is('read_at', null)
      .select('id');

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }

    return { count: data ? data.length : 0 };
  }

  /**
   * Get active business attention conditions projected for current user's capabilities
   */
  static async getNeedsAttention(
    supabase: SupabaseClient<Database>,
    params: {
      businessId: string;
      userId: string;
    }
  ): Promise<BusinessAttentionSummary> {
    const { data: membership } = await supabase
      .from('business_memberships')
      .select('role')
      .eq('business_id', params.businessId)
      .eq('user_id', params.userId)
      .eq('membership_status', 'active')
      .maybeSingle();

    const emptySummary: BusinessAttentionSummary = {
      businessId: params.businessId,
      totalActiveCount: 0,
      items: [],
      groupedByCategory: {
        INVENTORY: [],
        INVOICES: [],
        BOOKKEEPER: [],
        BUSINESS_HEALTH: [],
        CREDIT_PASSPORT: [],
        BUSINESS_SUMMARIES: [],
        AUTOMATIONS: [],
      },
    };

    if (!membership) return emptySummary;
    const currentRole = membership.role;

    // Fetch unresolved attention events from Prompt 8
    const { data: events, error } = await supabase
      .from('business_attention_events')
      .select('*')
      .eq('business_id', params.businessId)
      .eq('status', 'active')
      .order('first_detected_at', { ascending: false });

    if (error || !events || events.length === 0) {
      return emptySummary;
    }

    const items: BusinessAttentionItem[] = [];
    const groupedByCategory: Record<NotificationCategory, BusinessAttentionItem[]> = {
      INVENTORY: [],
      INVOICES: [],
      BOOKKEEPER: [],
      BUSINESS_HEALTH: [],
      CREDIT_PASSPORT: [],
      BUSINESS_SUMMARIES: [],
      AUTOMATIONS: [],
    };

    for (const event of events) {
      const policy = Object.values(NOTIFICATION_POLICY_REGISTRY).find((p) =>
        p.sourceAttentionTypes?.includes(event.type as BusinessAttentionType)
      );

      if (!policy) continue;

      // Check current user permissions
      const isPermitted = policy.requiredCapabilities.every((cap) =>
        hasPermission(currentRole, cap)
      );

      if (!isPermitted) continue;

      const metadata = (event.metadata as Record<string, unknown>) || {};
      const item: BusinessAttentionItem = {
        id: event.id,
        businessId: event.business_id,
        type: event.type as BusinessAttentionType,
        category: event.category as any,
        severity: event.severity as any,
        title: policy.formatTitle(metadata),
        description: policy.formatBody(metadata),
        firstDetectedAt: event.first_detected_at,
        lastDetectedAt: event.last_detected_at,
        sourceType: event.source_type,
        sourceReference: event.source_reference,
        primaryActionKey: policy.primaryActionKey,
        requiredCapabilities: policy.requiredCapabilities,
        metadata,
      };

      items.push(item);
      groupedByCategory[policy.category].push(item);
    }

    return {
      businessId: params.businessId,
      totalActiveCount: items.length,
      items,
      groupedByCategory,
    };
  }

  /**
   * Get notification preferences for current user
   */
  static async getPreferences(
    supabase: SupabaseClient<Database>,
    params: {
      businessId: string;
      userId: string;
    }
  ): Promise<NotificationPreference[]> {
    const { data: membership } = await supabase
      .from('business_memberships')
      .select('role')
      .eq('business_id', params.businessId)
      .eq('user_id', params.userId)
      .eq('membership_status', 'active')
      .maybeSingle();

    if (!membership) return [];
    const currentRole = membership.role;

    const { data: storedPrefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('business_id', params.businessId)
      .eq('user_id', params.userId)
      .eq('channel', 'IN_APP');

    const storedMap = new Map<string, Database['public']['Tables']['notification_preferences']['Row']>();
    if (storedPrefs) {
      for (const pref of storedPrefs) {
        storedMap.set(pref.category, pref);
      }
    }

    const categories: NotificationCategory[] = [
      'INVENTORY',
      'INVOICES',
      'BOOKKEEPER',
      'BUSINESS_HEALTH',
      'CREDIT_PASSPORT',
      'BUSINESS_SUMMARIES',
      'AUTOMATIONS',
    ];

    const result: NotificationPreference[] = [];

    for (const cat of categories) {
      const requiredFeature = CATEGORY_FEATURE_MAP[cat];
      // Only include categories the user has current capability to access
      if (!hasPermission(currentRole, requiredFeature)) {
        continue;
      }

      const stored = storedMap.get(cat);
      if (stored) {
        result.push({
          id: stored.id,
          businessId: stored.business_id,
          userId: stored.user_id,
          category: stored.category as NotificationCategory,
          channel: 'IN_APP',
          enabled: stored.enabled,
          createdAt: stored.created_at,
          updatedAt: stored.updated_at,
          updatedByUserId: stored.updated_by_user_id,
        });
      } else {
        // Fallback default
        result.push({
          id: `default-${cat}`,
          businessId: params.businessId,
          userId: params.userId,
          category: cat,
          channel: 'IN_APP',
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedByUserId: params.userId,
        });
      }
    }

    return result;
  }

  /**
   * Update a notification preference for current user
   */
  static async updatePreference(
    supabase: SupabaseClient<Database>,
    params: {
      businessId: string;
      userId: string;
      category: NotificationCategory;
      channel: NotificationChannel;
      enabled: boolean;
    }

  ): Promise<NotificationPreference> {
    const { data: membership } = await supabase
      .from('business_memberships')
      .select('role')
      .eq('business_id', params.businessId)
      .eq('user_id', params.userId)
      .eq('membership_status', 'active')
      .maybeSingle();

    if (!membership) {
      throw new Error('Active business membership required');
    }

    const requiredFeature = CATEGORY_FEATURE_MAP[params.category];
    if (!hasPermission(membership.role, requiredFeature)) {
      throw new Error('User lacks permission for this notification category');
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          business_id: params.businessId,
          user_id: params.userId,
          category: params.category,
          channel: params.channel,
          enabled: params.enabled,
          updated_at: now,
          updated_by_user_id: params.userId,
        },
        {
          onConflict: 'business_id, user_id, category, channel',
        }
      )
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to update preference: ${error?.message || 'Unknown error'}`);
    }

    return {
      id: data.id,
      businessId: data.business_id,
      userId: data.user_id,
      category: data.category as NotificationCategory,
      channel: 'IN_APP',
      enabled: data.enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      updatedByUserId: data.updated_by_user_id,
    };
  }
}
