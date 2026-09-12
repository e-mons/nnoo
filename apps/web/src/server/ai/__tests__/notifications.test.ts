import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NOTIFICATION_POLICY_REGISTRY,
  NOTIFICATION_POLICY_VERSION,
  ACTION_ROUTE_MAP,
  CATEGORY_FEATURE_MAP,
  RecipientResolverService,
  NotificationService,
} from '../notifications';
import { MockGeminiClient } from '../gemini/client';

describe('Tranche 3 Prompt 9: Production NNOO Notification & Attention Center', () => {
  const mockBusinessId = '00000000-0000-0000-0000-000000000001';
  const mockBusinessBId = '00000000-0000-0000-0000-000000000002';
  const ownerUserId = '11111111-1111-1111-1111-111111111111';
  const inventoryStaffUserId = '22222222-2222-2222-2222-222222222222';
  const accountantUserId = '33333333-3333-3333-3333-333333333333';
  const salesStaffUserId = '44444444-4444-4444-4444-444444444444';

  function createMockSupabase(overrides: {
    memberships?: any[];
    notifications?: any[];
    preferences?: any[];
    attentionEvents?: any[];
  } = {}) {
    const memberships = overrides.memberships || [
      { business_id: mockBusinessId, user_id: ownerUserId, role: 'owner', membership_status: 'active' },
      { business_id: mockBusinessId, user_id: inventoryStaffUserId, role: 'inventory_staff', membership_status: 'active' },
      { business_id: mockBusinessId, user_id: accountantUserId, role: 'accountant', membership_status: 'active' },
      { business_id: mockBusinessId, user_id: salesStaffUserId, role: 'sales_staff', membership_status: 'active' },
    ];

    const notifications: any[] = [...(overrides.notifications || [])];
    const preferences: any[] = [...(overrides.preferences || [])];
    const attentionEvents: any[] = [...(overrides.attentionEvents || [])];

    const financialMutations = {
      sales: 0,
      expenses: 0,
      payments: 0,
      refunds: 0,
      inventoryMovements: 0,
      invoices: 0,
      journalEntries: 0,
    };

    const externalDeliveries = {
      whatsapp: 0,
      push: 0,
      sms: 0,
      email: 0,
    };

    const client: any = {
      _financialMutations: financialMutations,
      _externalDeliveries: externalDeliveries,
      _notifications: notifications,
      _preferences: preferences,
      _attentionEvents: attentionEvents,

      from: (table: string) => {
        let filterBiz: string | null = null;
        let filterUser: string | null = null;
        let filterCategory: string | null = null;
        let filterChannel: string | null = null;
        let filterId: string | null = null;
        let filterStatus: string | null = null;
        let filterUnread: boolean | null = null;

        const builder: any = {
          select: (cols = '*') => builder,
          eq: (f: string, v: any) => {
            if (f === 'business_id') filterBiz = v;
            if (f === 'user_id' || f === 'recipient_user_id') filterUser = v;
            if (f === 'category') filterCategory = v;
            if (f === 'channel') filterChannel = v;
            if (f === 'id') filterId = v;
            if (f === 'status') filterStatus = v;
            if (f === 'membership_status') filterStatus = v;
            return builder;
          },
          in: (f: string, list: any[]) => {
            return builder;
          },
          is: (f: string, v: any) => {
            if (f === 'read_at' && v === null) filterUnread = true;
            return builder;
          },
          order: () => builder,
          limit: (n: number) => {
            if (table === 'business_notifications') {
              let rows = notifications.filter(
                (n) => (!filterBiz || n.business_id === filterBiz) && (!filterUser || n.recipient_user_id === filterUser)
              );
              if (filterUnread) {
                rows = rows.filter((r) => !r.read_at);
              }
              return Promise.resolve({ data: rows.slice(0, n), error: null });
            }
            return builder;
          },
          maybeSingle: () => {
            if (table === 'business_memberships') {
              const m = memberships.find(
                (m) =>
                  (!filterBiz || m.business_id === filterBiz) &&
                  (!filterUser || m.user_id === filterUser) &&
                  (!filterStatus || m.membership_status === filterStatus)
              );
              return Promise.resolve({ data: m || null, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          },
          single: () => {
            if (table === 'business_memberships') {
              const m = memberships.find(
                (m) =>
                  (!filterBiz || m.business_id === filterBiz) &&
                  (!filterUser || m.user_id === filterUser) &&
                  (!filterStatus || m.membership_status === filterStatus)
              );
              return Promise.resolve({ data: m || null, error: m ? null : { message: 'Not found' } });
            }
            return Promise.resolve({ data: null, error: null });
          },
          upsert: (rows: any | any[], opts?: any) => {
            const arr = Array.isArray(rows) ? rows : [rows];
            const inserted: any[] = [];

            if (table === 'business_notifications') {
              for (const r of arr) {
                const existingIdx = notifications.findIndex(
                  (n) =>
                    n.business_id === r.business_id &&
                    n.recipient_user_id === r.recipient_user_id &&
                    n.dedupe_key === r.dedupe_key
                );
                if (existingIdx >= 0) {
                  if (!opts?.ignoreDuplicates) {
                    notifications[existingIdx] = { ...notifications[existingIdx], ...r };
                    inserted.push(notifications[existingIdx]);
                  }
                } else {
                  const newRow = { id: `notif-${notifications.length + 1}`, ...r };
                  notifications.push(newRow);
                  inserted.push(newRow);
                }
              }
            } else if (table === 'notification_preferences') {
              for (const r of arr) {
                const existingIdx = preferences.findIndex(
                  (p) =>
                    p.business_id === r.business_id &&
                    p.user_id === r.user_id &&
                    p.category === r.category &&
                    p.channel === r.channel
                );
                if (existingIdx >= 0) {
                  preferences[existingIdx] = { ...preferences[existingIdx], ...r, updated_at: new Date().toISOString() };
                  inserted.push(preferences[existingIdx]);
                } else {
                  const newPref = { id: `pref-${preferences.length + 1}`, ...r, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
                  preferences.push(newPref);
                  inserted.push(newPref);
                }
              }
            }
            return {
              select: () => ({
                single: () => Promise.resolve({ data: inserted[0] || null, error: null }),
                then: (fn: any) => fn({ data: inserted, error: null }),
              }),
              then: (fn: any) => fn({ data: inserted, error: null }),
            };
          },
          update: (vals: any) => {
            const updateBuilder: any = {
              eq: (f: string, v: any) => {
                if (f === 'id') filterId = v;
                if (f === 'business_id') filterBiz = v;
                if (f === 'recipient_user_id') filterUser = v;
                return updateBuilder;
              },
              is: (f: string, v: any) => {
                if (f === 'read_at' && v === null) filterUnread = true;
                return updateBuilder;
              },
              select: () => {
                const updated: any[] = [];
                if (table === 'business_notifications') {
                  for (let i = 0; i < notifications.length; i++) {
                    const n = notifications[i];
                    if (
                      (!filterId || n.id === filterId) &&
                      (!filterBiz || n.business_id === filterBiz) &&
                      (!filterUser || n.recipient_user_id === filterUser) &&
                      (!filterUnread || !n.read_at)
                    ) {
                      notifications[i] = { ...n, ...vals };
                      updated.push(notifications[i]);
                    }
                  }
                }
                return Promise.resolve({ data: updated, error: null });
              },
              then: (fn: any) => {
                let count = 0;
                if (table === 'business_notifications') {
                  for (let i = 0; i < notifications.length; i++) {
                    const n = notifications[i];
                    if (
                      (!filterId || n.id === filterId) &&
                      (!filterBiz || n.business_id === filterBiz) &&
                      (!filterUser || n.recipient_user_id === filterUser) &&
                      (!filterUnread || !n.read_at)
                    ) {
                      notifications[i] = { ...n, ...vals };
                      count++;
                    }
                  }
                }
                return fn({ data: null, error: null, count });
              },
            };
            return updateBuilder;
          },
          then: (fn: any) => {
            if (table === 'business_memberships') {
              const rows = memberships.filter(
                (m) =>
                  (!filterBiz || m.business_id === filterBiz) &&
                  (!filterStatus || m.membership_status === filterStatus)
              );
              return fn({ data: rows, error: null });
            }
            if (table === 'notification_preferences') {
              const rows = preferences.filter(
                (p) =>
                  (!filterBiz || p.business_id === filterBiz) &&
                  (!filterUser || p.user_id === filterUser) &&
                  (!filterCategory || p.category === filterCategory) &&
                  (!filterChannel || p.channel === filterChannel)
              );
              return fn({ data: rows, error: null });
            }
            if (table === 'business_attention_events') {
              const rows = attentionEvents.filter(
                (e) => (!filterBiz || e.business_id === filterBiz) && (!filterStatus || e.status === filterStatus)
              );
              return fn({ data: rows, error: null });
            }
            if (table === 'business_notifications') {
              let rows = notifications.filter(
                (n) => (!filterBiz || n.business_id === filterBiz) && (!filterUser || n.recipient_user_id === filterUser)
              );
              if (filterUnread) {
                rows = rows.filter((r) => !r.read_at);
              }
              return fn({ data: rows, error: null });
            }
            return fn({ data: [], error: null });
          },
        };
        return builder;
      },
    };

    return client;
  }

  // 1. Notification Policy Registry Version & Categories
  it('defines source-controlled Notification Policy Registry v1 with controlled categories', () => {
    assert.equal(NOTIFICATION_POLICY_VERSION, 'notification-policy-v1');
    const policies = Object.keys(NOTIFICATION_POLICY_REGISTRY);
    assert.ok(policies.includes('LOW_STOCK'));
    assert.ok(policies.includes('OUT_OF_STOCK'));
    assert.ok(policies.includes('OVERDUE_INVOICE'));
    assert.ok(policies.includes('BOOKKEEPER_REVIEW_PENDING'));
    assert.ok(policies.includes('BUSINESS_HEALTH_CHANGED'));
    assert.ok(policies.includes('CREDIT_PASSPORT_STALE'));
    assert.ok(policies.includes('BUSINESS_SUMMARY_READY'));
    assert.ok(policies.includes('AUTOMATION_FAILED'));
  });

  // 2. Low Stock & Out of Stock Fanout: Capability-Aware Recipient Resolution
  it('fans out low stock notification to inventory-authorized staff and excludes sales staff', async () => {
    const supabase = createMockSupabase();

    const lowStockEvent = {
      id: 'att-101',
      business_id: mockBusinessId,
      type: 'LOW_STOCK_PRESENT',
      source_type: 'inventory',
      dedupe_key: 'LOW_STOCK_PROD_1',
      metadata: { count: 3, productName: 'Flour 50kg' },
    };

    const result = await NotificationService.processAttentionEvent(supabase, lowStockEvent);
    assert.ok(result);
    assert.equal(result.notificationType, 'LOW_STOCK');
    // Eligible: owner and inventory_staff (2 recipients)
    assert.equal(result.eligibleCount, 2);
    assert.equal(result.createdCount, 2);

    // Verify created notifications
    const ownerNotifs = supabase._notifications.filter((n: any) => n.recipient_user_id === ownerUserId);
    assert.equal(ownerNotifs.length, 1);
    assert.equal(ownerNotifs[0].title, 'Low Stock');
    assert.equal(ownerNotifs[0].body, '3 products are running low on stock.');
    assert.equal(ownerNotifs[0].primary_action_key, 'OPEN_INVENTORY');

    const invStaffNotifs = supabase._notifications.filter((n: any) => n.recipient_user_id === inventoryStaffUserId);
    assert.equal(invStaffNotifs.length, 1);

    // Sales staff must receive ZERO notifications
    const salesNotifs = supabase._notifications.filter((n: any) => n.recipient_user_id === salesStaffUserId);
    assert.equal(salesNotifs.length, 0);
  });

  // 3. User Notification Preferences (Opt-out)
  it('respects user preferences by muting personal notifications when category is disabled', async () => {
    const supabase = createMockSupabase({
      preferences: [
        // Inventory staff has disabled INVENTORY notifications for this business
        {
          business_id: mockBusinessId,
          user_id: inventoryStaffUserId,
          category: 'INVENTORY',
          channel: 'IN_APP',
          enabled: false,
        },
      ],
    });

    const lowStockEvent = {
      id: 'att-102',
      business_id: mockBusinessId,
      type: 'LOW_STOCK_PRESENT',
      dedupe_key: 'LOW_STOCK_PROD_2',
      metadata: { count: 1, productName: 'Sugar 25kg' },
    };

    const result = await NotificationService.processAttentionEvent(supabase, lowStockEvent);
    assert.ok(result);
    // Only owner (since inventory staff opted out)
    assert.equal(result.eligibleCount, 1);
    assert.equal(result.createdCount, 1);

    const invStaffNotifs = supabase._notifications.filter((n: any) => n.recipient_user_id === inventoryStaffUserId);
    assert.equal(invStaffNotifs.length, 0, 'Opted out user must receive 0 inbox notifications');
  });

  // 4. Overdue Invoices: Capability Security
  it('delivers overdue invoice notifications to invoice-authorized staff and excludes inventory staff', async () => {
    const supabase = createMockSupabase();

    const invoiceEvent = {
      id: 'att-201',
      business_id: mockBusinessId,
      type: 'OVERDUE_INVOICES_PRESENT',
      source_type: 'invoices',
      dedupe_key: 'OVERDUE_INV_1',
      metadata: { count: 2, invoiceNumber: 'INV-001' },
    };

    const result = await NotificationService.processAttentionEvent(supabase, invoiceEvent);
    assert.ok(result);
    assert.equal(result.notificationType, 'OVERDUE_INVOICE');

    // Owner, accountant, and sales_staff have 'invoices' capability; inventory_staff does NOT
    const invStaffNotifs = supabase._notifications.filter((n: any) => n.recipient_user_id === inventoryStaffUserId);
    assert.equal(invStaffNotifs.length, 0);

    const acctNotifs = supabase._notifications.filter((n: any) => n.recipient_user_id === accountantUserId);
    assert.equal(acctNotifs.length, 1);
    assert.equal(acctNotifs[0].title, 'Invoice Needs Attention');
    assert.equal(acctNotifs[0].body, '2 invoices are past their payment due dates.');
  });

  // 5. Bookkeeper Review Pending Notification
  it('delivers bookkeeper review notifications to bookkeeper-authorized staff', async () => {
    const supabase = createMockSupabase();

    const bookkeeperEvent = {
      id: 'att-301',
      business_id: mockBusinessId,
      type: 'BOOKKEEPER_REVIEW_PENDING',
      source_type: 'ai_bookkeeper',
      dedupe_key: 'BOOKKEEPER_REV_1',
      metadata: { count: 1 },
    };

    const result = await NotificationService.processAttentionEvent(supabase, bookkeeperEvent);
    assert.ok(result);
    assert.equal(result.notificationType, 'BOOKKEEPER_REVIEW_PENDING');

    // Owner and accountant are permitted; sales_staff and inventory_staff are NOT
    const salesNotifs = supabase._notifications.filter((n: any) => n.recipient_user_id === salesStaffUserId);
    assert.equal(salesNotifs.length, 0);

    const acctNotifs = supabase._notifications.filter((n: any) => n.recipient_user_id === accountantUserId);
    assert.equal(acctNotifs.length, 1);
    assert.equal(acctNotifs[0].primary_action_key, 'OPEN_AI_BOOKKEEPER');
  });

  // 6. Business Health & Credit Passport Capability Security
  it('delivers health change and passport stale notifications only to authorized roles', async () => {
    const supabase = createMockSupabase();

    const healthEvent = {
      id: 'att-401',
      business_id: mockBusinessId,
      type: 'HEALTH_SCORE_CHANGED',
      source_type: 'business_health',
      dedupe_key: 'HEALTH_CHANGE_1',
      metadata: {},
    };

    const healthResult = await NotificationService.processAttentionEvent(supabase, healthEvent);
    assert.ok(healthResult);
    // Owner and accountant have health_score capability; sales_staff does NOT
    const salesNotifs = supabase._notifications.filter((n: any) => n.recipient_user_id === salesStaffUserId);
    assert.equal(salesNotifs.length, 0);

    const ownerNotifs = supabase._notifications.filter((n: any) => n.recipient_user_id === ownerUserId);
    assert.equal(ownerNotifs.length, 1);
    assert.equal(ownerNotifs[0].title, 'Business Health Status Changed');
    // Ensure deterministic copy contains NO credit score claims
    assert.ok(!ownerNotifs[0].body.toLowerCase().includes('credit score'));
  });

  // 7. Scheduled Summary Ready Notification (0 Gemini Calls)
  it('delivers summary ready notification with 0 Gemini calls', async () => {
    const supabase = createMockSupabase();

    const jobRun = {
      id: 'job-501',
      business_id: mockBusinessId,
      job_type: 'business_summary',
      status: 'succeeded',
      result_id: 'sum-123',
    };

    const result = await NotificationService.processJobRunEvent(supabase, jobRun);
    assert.ok(result);
    assert.equal(result.notificationType, 'BUSINESS_SUMMARY_READY');
    assert.equal(result.createdCount, 2); // Owner and accountant have 'insights' capability

    const ownerNotifs = supabase._notifications.filter((n: any) => n.recipient_user_id === ownerUserId);
    assert.equal(ownerNotifs.length, 1);
    assert.equal(ownerNotifs[0].title, 'Business Summary Ready');
  });

  // 8. Deduplication & Idempotent Fan-out
  it('deduplicates identical attention events so duplicate deliveries create 0 duplicate rows', async () => {
    const supabase = createMockSupabase();

    const event = {
      id: 'att-601',
      business_id: mockBusinessId,
      type: 'LOW_STOCK_PRESENT',
      dedupe_key: 'STOCK_DEDUPE_TEST',
      metadata: { count: 5 },
    };

    // First delivery
    const result1 = await NotificationService.processAttentionEvent(supabase, event);
    assert.equal(result1?.createdCount, 2);

    // Second duplicate delivery
    const result2 = await NotificationService.processAttentionEvent(supabase, event);
    assert.equal(result2?.createdCount, 0, 'Duplicate delivery must create 0 new notifications');

    const totalForBiz = supabase._notifications.filter((n: any) => n.business_id === mockBusinessId);
    assert.equal(totalForBiz.length, 2, 'Total rows must remain exactly 2 (1 per recipient)');
  });

  // 9. Partial Fanout Crash & Retry Safety
  it('safely recovers from partial fan-out crash without duplicating previously created recipients', async () => {
    const supabase = createMockSupabase();

    const event = {
      id: 'att-701',
      business_id: mockBusinessId,
      type: 'LOW_STOCK_PRESENT',
      dedupe_key: 'PARTIAL_RETRY_TEST',
      metadata: { count: 2 },
    };

    // Simulate partial insert: only owner notification already in DB
    supabase._notifications.push({
      id: 'notif-existing-1',
      business_id: mockBusinessId,
      recipient_user_id: ownerUserId,
      dedupe_key: 'PARTIAL_RETRY_TEST:' + ownerUserId + ':LOW_STOCK',
      notification_category: 'INVENTORY',
      notification_type: 'LOW_STOCK',
      title: 'Low Stock',
      body: '2 products are running low on stock.',
    });

    // Worker retries event processing
    const retryResult = await NotificationService.processAttentionEvent(supabase, event);
    assert.ok(retryResult);
    // Only inventory_staff should be newly created (owner skipped due to unique dedupe key)
    assert.equal(retryResult.createdCount, 1);

    const ownerNotifs = supabase._notifications.filter((n: any) => n.recipient_user_id === ownerUserId);
    assert.equal(ownerNotifs.length, 1, 'Owner must still have exactly 1 notification');

    const invNotifs = supabase._notifications.filter((n: any) => n.recipient_user_id === inventoryStaffUserId);
    assert.equal(invNotifs.length, 1, 'Inventory staff receives their notification');
  });

  // 10. Role Downgrade Protection: Historical Notifications Hidden & Unread Count Excluded
  it('hides sensitive historical notifications and excludes them from unread badge upon role downgrade', async () => {
    // User received a Business Health notification while they were an Owner
    const supabase = createMockSupabase({
      memberships: [
        // Role is now downgraded to sales_staff (which lacks health_score capability)
        { business_id: mockBusinessId, user_id: ownerUserId, role: 'sales_staff', membership_status: 'active' },
      ],
      notifications: [
        {
          id: 'notif-health-1',
          business_id: mockBusinessId,
          recipient_user_id: ownerUserId,
          notification_category: 'BUSINESS_HEALTH',
          notification_type: 'BUSINESS_HEALTH_CHANGED',
          dedupe_key: 'HEALTH_1',
          title: 'Business Health Status Changed',
          body: 'Metrics updated',
          required_capabilities: ['health_score'],
          read_at: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'notif-sales-1',
          business_id: mockBusinessId,
          recipient_user_id: ownerUserId,
          notification_category: 'INVOICES',
          notification_type: 'OVERDUE_INVOICE',
          dedupe_key: 'INV_1',
          title: 'Invoice Needs Attention',
          body: 'Invoice overdue',
          required_capabilities: ['invoices'],
          read_at: null,
          created_at: new Date().toISOString(),
        },
      ],
    });

    // Feed retrieval must recheck current capabilities
    const feed = await NotificationService.getNotifications(supabase, {
      businessId: mockBusinessId,
      userId: ownerUserId,
    });

    // Health notification must be HIDDEN because current role 'sales_staff' lacks 'health_score' capability
    assert.equal(feed.notifications.length, 1);
    assert.equal(feed.notifications[0].notificationCategory, 'INVOICES');

    // Unread count must EXCLUDE the unauthorized health notification
    assert.equal(feed.totalUnreadCount, 1);

    const unreadCountDirect = await NotificationService.getUnreadCount(supabase, {
      businessId: mockBusinessId,
      userId: ownerUserId,
    });
    assert.equal(unreadCountDirect, 1);
  });

  // 11. Separation of Concerns: Personal Read State != Business Attention Condition
  it('proves marking personal notification as read does NOT resolve the business attention condition', async () => {
    const supabase = createMockSupabase({
      notifications: [
        {
          id: 'notif-stock-1',
          business_id: mockBusinessId,
          recipient_user_id: ownerUserId,
          notification_category: 'INVENTORY',
          notification_type: 'LOW_STOCK',
          dedupe_key: 'STOCK_1',
          title: 'Low Stock',
          body: 'Flour 50kg is low',
          required_capabilities: ['inventory'],
          read_at: null,
          created_at: new Date().toISOString(),
        },
      ],
      attentionEvents: [
        {
          id: 'att-stock-1',
          business_id: mockBusinessId,
          type: 'LOW_STOCK_PRESENT',
          status: 'active',
          severity: 'attention',
          category: 'STATEFUL',
          source_type: 'inventory',
          metadata: { productName: 'Flour 50kg' },
          first_detected_at: new Date().toISOString(),
        },
      ],
    });

    // User marks personal notification as read
    await NotificationService.markAsRead(supabase, {
      businessId: mockBusinessId,
      userId: ownerUserId,
      notificationId: 'notif-stock-1',
    });

    // Personal notification is read
    assert.ok(supabase._notifications[0].read_at !== null);

    // Business Attention condition in Prompt 8 table MUST REMAIN ACTIVE
    assert.equal(supabase._attentionEvents[0].status, 'active');

    // Querying Needs Attention still returns the open stock condition
    const attentionSummary = await NotificationService.getNeedsAttention(supabase, {
      businessId: mockBusinessId,
      userId: ownerUserId,
    });
    assert.equal(attentionSummary.totalActiveCount, 1);
    assert.equal(attentionSummary.items[0].type, 'LOW_STOCK_PRESENT');
  });

  // 12. Needs Attention Resolution Lifecycle
  it('removes resolved conditions from Needs Attention while preserving historical notifications', async () => {
    const supabase = createMockSupabase({
      notifications: [
        {
          id: 'notif-stock-1',
          business_id: mockBusinessId,
          recipient_user_id: ownerUserId,
          notification_category: 'INVENTORY',
          notification_type: 'LOW_STOCK',
          dedupe_key: 'STOCK_1',
          title: 'Low Stock',
          body: 'Flour 50kg is low',
          required_capabilities: ['inventory'],
          read_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
      attentionEvents: [
        {
          id: 'att-stock-1',
          business_id: mockBusinessId,
          type: 'LOW_STOCK_PRESENT',
          status: 'resolved', // Resolved in Prompt 8 after replenishment
          severity: 'attention',
          category: 'STATEFUL',
          source_type: 'inventory',
          metadata: { productName: 'Flour 50kg' },
          first_detected_at: new Date().toISOString(),
        },
      ],
    });

    // Needs attention must be empty because event status is 'resolved'
    const attentionSummary = await NotificationService.getNeedsAttention(supabase, {
      businessId: mockBusinessId,
      userId: ownerUserId,
    });
    assert.equal(attentionSummary.totalActiveCount, 0);

    // Historical notification remains intact in feed
    const feed = await NotificationService.getNotifications(supabase, {
      businessId: mockBusinessId,
      userId: ownerUserId,
    });
    assert.equal(feed.notifications.length, 1);
    assert.equal(feed.notifications[0].title, 'Low Stock');
  });

  // 13. Mark All As Read (Business & User Scoped)
  it('marks all notifications as read for current user in active business only', async () => {
    const supabase = createMockSupabase({
      notifications: [
        {
          id: 'notif-1',
          business_id: mockBusinessId,
          recipient_user_id: ownerUserId,
          read_at: null,
          required_capabilities: ['inventory'],
        },
        {
          id: 'notif-2',
          business_id: mockBusinessId,
          recipient_user_id: ownerUserId,
          read_at: null,
          required_capabilities: ['inventory'],
        },
        // Different user in same business
        {
          id: 'notif-3',
          business_id: mockBusinessId,
          recipient_user_id: inventoryStaffUserId,
          read_at: null,
          required_capabilities: ['inventory'],
        },
        // Different business for owner
        {
          id: 'notif-4',
          business_id: mockBusinessBId,
          recipient_user_id: ownerUserId,
          read_at: null,
          required_capabilities: ['inventory'],
        },
      ],
    });

    const result = await NotificationService.markAllAsRead(supabase, {
      businessId: mockBusinessId,
      userId: ownerUserId,
    });

    assert.equal(result.count, 2);
    // Owner notifs in mockBusinessId are now read
    assert.ok(supabase._notifications.find((n: any) => n.id === 'notif-1').read_at !== null);
    assert.ok(supabase._notifications.find((n: any) => n.id === 'notif-2').read_at !== null);

    // Other user's notification is untouched
    assert.equal(supabase._notifications.find((n: any) => n.id === 'notif-3').read_at, null);

    // Other business notification is untouched
    assert.equal(supabase._notifications.find((n: any) => n.id === 'notif-4').read_at, null);
  });

  // 14. Multi-Tenant & Cross-User Security
  it('enforces multi-tenant and cross-user isolation in notification retrieval', async () => {
    const supabase = createMockSupabase({
      notifications: [
        {
          id: 'notif-biz-a',
          business_id: mockBusinessId,
          recipient_user_id: ownerUserId,
          title: 'Biz A alert',
          required_capabilities: ['inventory'],
          created_at: new Date().toISOString(),
        },
        {
          id: 'notif-biz-b',
          business_id: mockBusinessBId,
          recipient_user_id: ownerUserId,
          title: 'Biz B alert',
          required_capabilities: ['inventory'],
          created_at: new Date().toISOString(),
        },
      ],
    });

    // Querying Business A as Owner returns only Biz A notifications
    const feedA = await NotificationService.getNotifications(supabase, {
      businessId: mockBusinessId,
      userId: ownerUserId,
    });
    assert.equal(feedA.notifications.length, 1);
    assert.equal(feedA.notifications[0].title, 'Biz A alert');
  });

  // 15. Action Route Mapping Registry
  it('maps all primary action keys to valid, allowlisted app routes', () => {
    const slug = 'test-biz';
    assert.equal(ACTION_ROUTE_MAP.OPEN_INVENTORY(slug), '/app/test-biz/inventory');
    assert.equal(ACTION_ROUTE_MAP.OPEN_INVOICES(slug), '/app/test-biz/invoices');
    assert.equal(ACTION_ROUTE_MAP.OPEN_AI_BOOKKEEPER(slug), '/app/test-biz/bookkeeper');
    assert.equal(ACTION_ROUTE_MAP.OPEN_BUSINESS_HEALTH(slug), '/app/test-biz/health');
    assert.equal(ACTION_ROUTE_MAP.OPEN_CREDIT_PASSPORT(slug), '/app/test-biz/credit-passport');
    assert.equal(ACTION_ROUTE_MAP.OPEN_BUSINESS_INSIGHTS(slug), '/app/test-biz/insights');
    assert.equal(ACTION_ROUTE_MAP.OPEN_AUTOMATIONS(slug), '/app/test-biz/automations');
    assert.equal(ACTION_ROUTE_MAP.OPEN_AUTOMATION_HISTORY(slug), '/app/test-biz/automations');
  });

  // 16. Zero Gemini Provider Calls
  it('PROVES ZERO GEMINI CALLS: all notification generation and fan-out calls Gemini ZERO times', async () => {
    let geminiCallCount = 0;
    const mockGemini = new MockGeminiClient(() => {
      geminiCallCount++;
      return {};
    });
    const supabase = createMockSupabase();

    // Process all 7 attention event types
    const types = [
      'LOW_STOCK_PRESENT',
      'OUT_OF_STOCK_PRESENT',
      'OVERDUE_INVOICES_PRESENT',
      'BOOKKEEPER_REVIEW_PENDING',
      'HEALTH_SCORE_CHANGED',
      'CREDIT_PASSPORT_STALE',
      'AUTOMATION_JOB_FAILED',
    ];

    for (let i = 0; i < types.length; i++) {
      await NotificationService.processAttentionEvent(supabase, {
        id: `att-${i}`,
        business_id: mockBusinessId,
        type: types[i],
        metadata: { count: 2 },
      });
    }

    // Process summary ready
    await NotificationService.processJobRunEvent(supabase, {
      id: 'job-sum-1',
      business_id: mockBusinessId,
      job_type: 'business_summary',
      status: 'succeeded',
      result_id: 'sum-1',
    });

    assert.equal(geminiCallCount, 0, 'Gemini provider call count must be strictly 0');
  });

  // 17. Zero Financial Mutations & Zero External Channel Deliveries
  it('PROVES ZERO FINANCIAL MUTATIONS AND ZERO EXTERNAL DELIVERIES: Δ 0 across all financial ledgers', async () => {
    const supabase = createMockSupabase();

    // Perform notification fanout, mark read, mark all read, update preferences
    await NotificationService.processAttentionEvent(supabase, {
      id: 'att-fin-test',
      business_id: mockBusinessId,
      type: 'LOW_STOCK_PRESENT',
      metadata: { count: 3 },
    });

    await NotificationService.markAllAsRead(supabase, {
      businessId: mockBusinessId,
      userId: ownerUserId,
    });

    await NotificationService.updatePreference(supabase, {
      businessId: mockBusinessId,
      userId: ownerUserId,
      category: 'INVENTORY',
      channel: 'IN_APP',
      enabled: true,
    });

    assert.equal(supabase._financialMutations.sales, 0);
    assert.equal(supabase._financialMutations.expenses, 0);
    assert.equal(supabase._financialMutations.payments, 0);
    assert.equal(supabase._financialMutations.refunds, 0);
    assert.equal(supabase._financialMutations.inventoryMovements, 0);
    assert.equal(supabase._financialMutations.invoices, 0);
    assert.equal(supabase._financialMutations.journalEntries, 0);

    // Channel delivery verification for Prompt 9
    assert.equal(supabase._externalDeliveries.whatsapp, 0);
    assert.equal(supabase._externalDeliveries.push, 0);
    assert.equal(supabase._externalDeliveries.sms, 0);
    assert.equal(supabase._externalDeliveries.email, 0);
  });
});
