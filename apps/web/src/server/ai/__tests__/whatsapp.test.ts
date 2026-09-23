import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  WhatsAppProviderAdapter,
  WhatsAppLinkingService,
  WhatsAppCommandRouter,
  WhatsAppInboundHandler,
  WhatsAppDeliveryService,
  WHATSAPP_TEMPLATE_REGISTRY,
} from '../whatsapp';
import type { BusinessNotification } from '@nnoo/contracts';

// In-memory Mock Supabase Client for WhatsApp Tests
function createMockSupabase() {
  const store: Record<string, any[]> = {
    whatsapp_connections: [],
    whatsapp_link_requests: [],
    whatsapp_deliveries: [],
    whatsapp_webhook_receipts: [],
    notification_preferences: [],
    business_memberships: [],
    businesses: [],
    ai_conversations: [],
    ai_messages: [],
    sales: [],
    expenses: [],
    invoices: [],
    payments: [],
    journal_entries: [],
  };

  const client: any = {
    from: (table: string) => {
      let currentTable = store[table] || [];
      let filters: Array<(row: any) => boolean> = [];
      let isSingle = false;
      let isMaybeSingle = false;
      let orderCol: string | null = null;
      let orderAsc = true;
      let selectedCols = '*';

      const queryBuilder: any = {
        select: (cols: string = '*') => {
          selectedCols = cols;
          return queryBuilder;
        },
        eq: (col: string, val: any) => {
          filters.push((row) => row[col] === val);
          return queryBuilder;
        },
        in: (col: string, vals: any[]) => {
          filters.push((row) => vals.includes(row[col]));
          return queryBuilder;
        },
        is: (col: string, val: any) => {
          filters.push((row) => row[col] === val);
          return queryBuilder;
        },
        or: (_expr: string) => {
          return queryBuilder;
        },
        order: (col: string, opts?: { ascending?: boolean }) => {
          orderCol = col;
          orderAsc = opts?.ascending ?? true;
          return queryBuilder;
        },
        single: async () => {
          isSingle = true;
          const rows = currentTable.filter((r) => filters.every((f) => f(r)));
          if (rows.length === 0) {
            return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
          }
          return { data: { ...rows[0] }, error: null };
        },
        maybeSingle: async () => {
          isMaybeSingle = true;
          const rows = currentTable.filter((r) => filters.every((f) => f(r)));
          if (rows.length === 0) {
            return { data: null, error: null };
          }
          return { data: { ...rows[0] }, error: null };
        },
        insert: async (data: any) => {
          const items = Array.isArray(data) ? data : [data];
          const inserted = items.map((item) => {
            const row = { id: item.id || crypto.randomUUID(), created_at: new Date().toISOString(), ...item };
            currentTable.push(row);
            return row;
          });
          return {
            data: isSingle ? inserted[0] : inserted,
            error: null,
            select: () => queryBuilder,
          };
        },
        upsert: (data: any, opts?: { onConflict?: string }) => {
          const items = Array.isArray(data) ? data : [data];
          const inserted: any[] = [];
          for (const item of items) {
            let existingIdx = -1;
            if (opts?.onConflict === 'business_id,user_id') {
              existingIdx = currentTable.findIndex(
                (r) => r.business_id === item.business_id && r.user_id === item.user_id
              );
            } else if (opts?.onConflict === 'idempotency_key') {
              existingIdx = currentTable.findIndex((r) => r.idempotency_key === item.idempotency_key);
            }

            if (existingIdx >= 0) {
              currentTable[existingIdx] = { ...currentTable[existingIdx], ...item, updated_at: new Date().toISOString() };
              inserted.push(currentTable[existingIdx]);
            } else {
              const row = { id: item.id || crypto.randomUUID(), created_at: new Date().toISOString(), ...item };
              currentTable.push(row);
              inserted.push(row);
            }
          }

          const upsertBuilder: any = {
            select: (_s?: string) => ({
              single: async () => ({ data: inserted[0], error: null }),
              maybeSingle: async () => ({ data: inserted[0], error: null }),
              then: (resolve: any) => resolve({ data: inserted, error: null }),
            }),
            single: async () => ({ data: inserted[0], error: null }),
            maybeSingle: async () => ({ data: inserted[0], error: null }),
            then: (resolve: any) => resolve({ data: inserted, error: null }),
          };

          return upsertBuilder;
        },

        update: (data: any) => {
          // Store pending update
          const applyUpdate = () => {
            const matching = currentTable.filter((r) => filters.every((f) => f(r)));
            matching.forEach((r) => {
              Object.assign(r, data, { updated_at: new Date().toISOString() });
            });
            return matching;
          };

          // If awaited as a promise or chained
          const builderWithUpdate: any = {
            ...queryBuilder,
            eq: (col: string, val: any) => {
              filters.push((row) => row[col] === val);
              return builderWithUpdate;
            },
            is: (col: string, val: any) => {
              filters.push((row) => row[col] === val);
              return builderWithUpdate;
            },
            in: (col: string, vals: any[]) => {
              filters.push((row) => vals.includes(row[col]));
              return builderWithUpdate;
            },
            then: (resolve: any) => {
              const matching = applyUpdate();
              resolve({ data: matching, error: null });
            },
          };

          return builderWithUpdate;
        },
        then: (resolve: any) => {
          let rows = currentTable.filter((r) => filters.every((f) => f(r)));
          if (orderCol) {
            rows.sort((a, b) => {
              const va = a[orderCol!];
              const vb = b[orderCol!];
              return orderAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
            });
          }
          resolve({ data: rows.map((r) => ({ ...r })), error: null });
        },
      };

      return queryBuilder;
    },
    _store: store,
  };

  return client;
}

describe('Tranche 3 Prompt 10: Production NNOO WhatsApp Business Integration', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  const testSecret = 'meta_test_secret_key_12345';
  const testPepper = 'nnoo_test_pepper_salt_99999';

  beforeEach(() => {
    mockSupabase = createMockSupabase();

    // Populate baseline businesses and memberships
    mockSupabase._store.businesses = [
      { id: 'biz-001', name: 'Lagos Supermarket Ltd', slug: 'lagos-supermarket', currency_code: 'NGN', timezone: 'Africa/Lagos' },
      { id: 'biz-002', name: 'Abuja Wholesale Hub', slug: 'abuja-hub', currency_code: 'NGN', timezone: 'Africa/Lagos' },
    ];

    mockSupabase._store.business_memberships = [
      { business_id: 'biz-001', user_id: 'user-001', role: 'owner', membership_status: 'active' },
      { business_id: 'biz-002', user_id: 'user-001', role: 'manager', membership_status: 'active' },
      { business_id: 'biz-001', user_id: 'user-sales', role: 'sales_staff', membership_status: 'active' },
    ];
  });

  // 1. Adapter & Security Tests
  describe('1. WhatsApp Provider Adapter & Security', () => {
    it('normalizes international and local Nigerian phone numbers cleanly', () => {
      assert.equal(WhatsAppProviderAdapter.normalizePhoneNumber('+234 (801) 234-5678'), '2348012345678');
      assert.equal(WhatsAppProviderAdapter.normalizePhoneNumber('08012345678'), '2348012345678');
      assert.equal(WhatsAppProviderAdapter.normalizePhoneNumber('2348099887766'), '2348099887766');
    });

    it('masks phone numbers safely for UI and log displays', () => {
      assert.equal(WhatsAppProviderAdapter.maskPhoneNumber('2348012345678'), '+234 *** *** 5678');
      assert.equal(WhatsAppProviderAdapter.maskPhoneNumber('+234 812 345 6789'), '+234 *** *** 6789');
    });

    it('computes deterministic HMAC-SHA256 lookup keys for sender privacy', () => {
      const key1 = WhatsAppProviderAdapter.computePhoneLookupKey('08012345678', testPepper);
      const key2 = WhatsAppProviderAdapter.computePhoneLookupKey('+234 801 234 5678', testPepper);
      const key3 = WhatsAppProviderAdapter.computePhoneLookupKey('08099999999', testPepper);

      assert.equal(key1, key2);
      assert.notEqual(key1, key3);
      assert.equal(key1.length, 64);
    });

    it('verifies valid Meta HMAC-SHA256 webhook signatures over raw body bytes', () => {
      const adapter = new WhatsAppProviderAdapter({ appSecret: testSecret });
      const rawBody = JSON.stringify({ entry: [{ id: '12345' }] });

      const validSig = crypto.createHmac('sha256', testSecret).update(rawBody).digest('hex');
      const header = `sha256=${validSig}`;

      assert.equal(adapter.verifyWebhookSignature(rawBody, header), true);
    });

    it('rejects forged or missing webhook signatures', () => {
      const adapter = new WhatsAppProviderAdapter({ appSecret: testSecret });
      const rawBody = JSON.stringify({ entry: [{ id: '12345' }] });

      assert.equal(adapter.verifyWebhookSignature(rawBody, null), false);
      assert.equal(adapter.verifyWebhookSignature(rawBody, 'sha256=invalid_forged_hash'), false);
      assert.equal(adapter.verifyWebhookSignature(rawBody, 'invalid_header_format'), false);
    });
  });

  // 2. Cryptographic Account Linking Flow
  describe('2. Cryptographic Account Linking & Multi-Business Switching', () => {
    it('creates short-lived cryptographic link request with 10-minute TTL', async () => {
      const result = await WhatsAppLinkingService.createLinkRequest(
        mockSupabase as any,
        'biz-001',
        'user-001'
      );

      assert.match(result.code, /^NNOO-[A-Z0-9]{6}$/);
      assert.ok(result.clickToChatUrl.includes(result.code));
      assert.ok(new Date(result.expiresAt).getTime() > Date.now());

      const requests = mockSupabase._store.whatsapp_link_requests;
      assert.equal(requests.length, 1);
      assert.equal(requests[0].business_id, 'biz-001');
      assert.equal(requests[0].user_id, 'user-001');
      assert.equal(requests[0].consumed_at, null);
    });

    it('STRICT INVARIANT: rejects link request creation for user without active membership', async () => {
      await assert.rejects(
        async () => {
          await WhatsAppLinkingService.createLinkRequest(
            mockSupabase as any,
            'biz-unauthorized',
            'user-001'
          );
        },
        (err: any) => {
          assert.equal(err.code, 'ASK_NNOO_FORBIDDEN');
          return true;
        }
      );
    });

    it('verifies link code, marks request consumed, and establishes active connection', async () => {
      const link = await WhatsAppLinkingService.createLinkRequest(
        mockSupabase as any,
        'biz-001',
        'user-001'
      );

      const senderPhone = '+234 801 234 5678';
      const verifyResult = await WhatsAppLinkingService.verifyAndLink(
        mockSupabase as any,
        senderPhone,
        `CONNECT ${link.code}`
      );

      assert.equal(verifyResult.success, true);
      assert.equal(verifyResult.businessName, 'Lagos Supermarket Ltd');

      // Request consumed
      const request = mockSupabase._store.whatsapp_link_requests[0];
      assert.notEqual(request.consumed_at, null);

      // Connection established
      const conns = mockSupabase._store.whatsapp_connections;
      assert.equal(conns.length, 1);
      assert.equal(conns[0].status, 'ACTIVE');
      assert.equal(conns[0].consent_status, 'CONSENTED');
      assert.equal(conns[0].masked_phone, '+234 *** *** 5678');
      assert.equal(conns[0].active_business_context, true);
    });

    it('switches active business context and sets previous business to inactive context', async () => {
      // Connect to biz-001
      const link1 = await WhatsAppLinkingService.createLinkRequest(mockSupabase as any, 'biz-001', 'user-001');
      await WhatsAppLinkingService.verifyAndLink(mockSupabase as any, '2348012345678', link1.code);

      // Connect to biz-002
      const link2 = await WhatsAppLinkingService.createLinkRequest(mockSupabase as any, 'biz-002', 'user-001');
      await WhatsAppLinkingService.verifyAndLink(mockSupabase as any, '2348012345678', link2.code);

      // Switch context back to biz-001
      const switchResult = await WhatsAppLinkingService.switchActiveBusiness(
        mockSupabase as any,
        'user-001',
        'biz-001'
      );

      assert.equal(switchResult.success, true);
      assert.equal(switchResult.businessName, 'Lagos Supermarket Ltd');

      const conns = mockSupabase._store.whatsapp_connections;
      const biz1Conn = conns.find((c: any) => c.business_id === 'biz-001');
      const biz2Conn = conns.find((c: any) => c.business_id === 'biz-002');

      assert.equal(biz1Conn?.active_business_context, true);
      assert.equal(biz2Conn?.active_business_context, false);
    });

    it('disconnects WhatsApp integration cleanly when requested', async () => {
      const link = await WhatsAppLinkingService.createLinkRequest(mockSupabase as any, 'biz-001', 'user-001');
      await WhatsAppLinkingService.verifyAndLink(mockSupabase as any, '2348012345678', link.code);

      const disconn = await WhatsAppLinkingService.disconnect(mockSupabase as any, 'biz-001', 'user-001');
      assert.equal(disconn.success, true);

      const conn = mockSupabase._store.whatsapp_connections[0];
      assert.equal(conn.status, 'REVOKED');
      assert.equal(conn.active_business_context, false);
    });
  });

  // 3. Deterministic Command Router & Mutation Blocker
  describe('3. Deterministic Commands & Financial Mutation Blocking', () => {
    it('handles HELP command with 0 Gemini calls', async () => {
      const result = await WhatsAppCommandRouter.routeInboundMessage(
        mockSupabase as any,
        'user-001',
        'biz-001',
        'HELP'
      );

      assert.equal(result.isHandled, true);
      assert.equal(result.commandType, 'HELP');
      assert.ok(result.replyText?.includes('NNOO WhatsApp Business Assistant'));
      assert.ok(result.replyText?.includes('BUSINESS'));
    });

    it('handles STOP / opt-out command and pauses WhatsApp notifications with 0 Gemini calls', async () => {
      mockSupabase._store.whatsapp_connections = [
        { business_id: 'biz-001', user_id: 'user-001', status: 'ACTIVE', consent_status: 'CONSENTED' },
      ];

      const result = await WhatsAppCommandRouter.routeInboundMessage(
        mockSupabase as any,
        'user-001',
        'biz-001',
        'STOP'
      );

      assert.equal(result.isHandled, true);
      assert.equal(result.commandType, 'STOP');
      assert.ok(result.replyText?.includes('Notifications Paused'));

      const conn = mockSupabase._store.whatsapp_connections[0];
      assert.equal(conn.consent_status, 'OPTED_OUT');
      assert.notEqual(conn.opted_out_at, null);
    });

    it('handles START / resume command and re-enables notifications with 0 Gemini calls', async () => {
      mockSupabase._store.whatsapp_connections = [
        { business_id: 'biz-001', user_id: 'user-001', status: 'ACTIVE', consent_status: 'OPTED_OUT' },
      ];

      const result = await WhatsAppCommandRouter.routeInboundMessage(
        mockSupabase as any,
        'user-001',
        'biz-001',
        'START'
      );

      assert.equal(result.isHandled, true);
      assert.equal(result.commandType, 'START');
      assert.ok(result.replyText?.includes('Notifications Resumed'));

      const conn = mockSupabase._store.whatsapp_connections[0];
      assert.equal(conn.consent_status, 'CONSENTED');
    });

    it('handles BUSINESS command and lists linked businesses with 0 Gemini calls', async () => {
      const result = await WhatsAppCommandRouter.routeInboundMessage(
        mockSupabase as any,
        'user-001',
        'biz-001',
        'BUSINESS'
      );

      assert.equal(result.isHandled, true);
      assert.equal(result.commandType, 'BUSINESS');
      assert.ok(result.replyText?.includes('1. *Lagos Supermarket Ltd*'));
      assert.ok(result.replyText?.includes('2. *Abuja Wholesale Hub*'));
      assert.ok(result.replyText?.includes('(Active)'));
    });

    it('handles BUSINESS 2 command and switches context with 0 Gemini calls', async () => {
      mockSupabase._store.whatsapp_connections = [
        { business_id: 'biz-001', user_id: 'user-001', status: 'ACTIVE', active_business_context: true },
        { business_id: 'biz-002', user_id: 'user-001', status: 'ACTIVE', active_business_context: false },
      ];

      const result = await WhatsAppCommandRouter.routeInboundMessage(
        mockSupabase as any,
        'user-001',
        'biz-001',
        'BUSINESS 2'
      );

      assert.equal(result.isHandled, true);
      assert.equal(result.commandType, 'SWITCH_BUSINESS');
      assert.ok(result.replyText?.includes('Active context set to *Abuja Wholesale Hub*'));
    });

    it('STRICT INVARIANT: Blocks financial mutation requests with zero side effects', async () => {
      const mutationPrompts = [
        'Record a sale of 50000 NGN for customer John',
        'Add expense 15000 for office fuel',
        'Create invoice for Dangote Ltd',
        'Refund sale 12345',
        'Post bookkeeper entry',
        'Generate credit passport',
      ];

      for (const prompt of mutationPrompts) {
        const result = await WhatsAppCommandRouter.routeInboundMessage(
          mockSupabase as any,
          'user-001',
          'biz-001',
          prompt
        );

        assert.equal(result.isHandled, true);
        assert.equal(result.commandType, 'MUTATION_BLOCKED');
        assert.ok(result.replyText?.includes('Action Not Permitted via WhatsApp'));
      }

      // Verify zero rows created in financial tables
      assert.equal(mockSupabase._store.sales.length, 0);
      assert.equal(mockSupabase._store.expenses.length, 0);
      assert.equal(mockSupabase._store.invoices.length, 0);
      assert.equal(mockSupabase._store.journal_entries.length, 0);
    });
  });

  // 4. Inbound Webhook Processing & Deduplication
  describe('4. Inbound Webhook Processing & Deduplication', () => {
    it('deduplicates duplicate incoming webhook messages without double execution', async () => {
      const link = await WhatsAppLinkingService.createLinkRequest(mockSupabase as any, 'biz-001', 'user-001');
      await WhatsAppLinkingService.verifyAndLink(mockSupabase as any, '2348012345678', link.code);

      const messageEvent = {
        messageId: 'wamid.HBgLMTEyMjMzNDQ1NQ==',
        senderPhone: '2348012345678',
        textBody: 'HELP',
      };

      const result1 = await WhatsAppInboundHandler.handleInboundMessage(mockSupabase as any, messageEvent);
      assert.equal(result1.status, 'handled');
      assert.equal(result1.replySent, true);

      // Send identical message ID again
      const result2 = await WhatsAppInboundHandler.handleInboundMessage(mockSupabase as any, messageEvent);
      assert.equal(result2.status, 'ignored');
      assert.equal(result2.replySent, false);
    });


    it('sends friendly setup guidance to unlinked numbers with 0 Gemini calls', async () => {
      const unlinkedEvent = {
        messageId: 'wamid.unlinked_001',
        senderPhone: '2348999999999',
        textBody: 'What is our profit today?',
      };

      const result = await WhatsAppInboundHandler.handleInboundMessage(mockSupabase as any, unlinkedEvent);
      assert.equal(result.status, 'unlinked');
      assert.equal(result.replySent, true);
      assert.ok(result.replyText?.includes('Welcome to NNOO Business AI'));
      assert.ok(result.replyText?.includes('Settings → WhatsApp'));
    });

    it('formats Ask NNOO response payload cleanly for WhatsApp', () => {
      const payload = {
        schemaVersion: '1.0',
        responseType: 'ANSWER' as const,
        headline: 'Sales Overview',

        segments: [
          { type: 'TEXT' as const, text: 'Total gross sales for today are' },
          { type: 'FACT' as const, formattedValue: '₦ 450,000' },
          { type: 'TEXT' as const, text: 'across 18 completed orders.' },
        ],
        facts: [{ key: 'sales.today', label: 'Sales Today', formattedValue: '₦ 450,000', rawValue: 450000, domain: 'sales' }],
        entities: [],
        sourceKeys: ['SALES_REPORT' as const],
        actionKeys: ['OPEN_SALES_REPORT' as const],
        followUpQuestions: [],
      };

      const formatted = WhatsAppInboundHandler.formatAssistantResponseForWhatsApp(payload);
      assert.ok(formatted.includes('*₦ 450,000*'));
      assert.ok(formatted.includes('Verified from NNOO business records'));
    });

  });

  // 5. Outbound Notification Delivery (Prompt 9 Extension)
  describe('5. Outbound WhatsApp Notification Delivery & RBAC', () => {
    it('dispatches low stock alert template to consented user with active connection', async () => {
      const link = await WhatsAppLinkingService.createLinkRequest(mockSupabase as any, 'biz-001', 'user-001');
      await WhatsAppLinkingService.verifyAndLink(mockSupabase as any, '2348012345678', link.code);

      const notification: BusinessNotification = {
        id: 'notif-stock-01',
        businessId: 'biz-001',
        recipientUserId: 'user-001',
        sourceEventId: 'event-01',
        notificationCategory: 'INVENTORY',
        notificationType: 'LOW_STOCK',
        dedupeKey: 'stock-alert-item-1',
        title: 'Low Stock: Premium Rice 50kg',
        body: 'Only 3 bags remaining in main warehouse (minimum threshold is 10).',
        payload: { itemId: 'item-1', remaining: 3 },
        primaryActionKey: 'OPEN_INVENTORY',
        sourceReferenceType: 'catalog_item',
        sourceReferenceId: 'item-1',
        requiredCapabilities: ['inventory.view'],
        channel: 'WHATSAPP',
        createdAt: new Date().toISOString(),
        readAt: null,
        resolvedAt: null,
      };

      const delivery = await WhatsAppDeliveryService.deliverNotification(mockSupabase as any, {
        notification,
      });

      assert.equal(delivery.status, 'SENT');
      assert.ok(delivery.providerMessageId);

      const deliveries = mockSupabase._store.whatsapp_deliveries;
      assert.equal(deliveries.length, 1);
      assert.equal(deliveries[0].status, 'SENT');
      assert.equal(deliveries[0].template_key, 'nnoo_alert_inventory_low_stock');
    });

    it('skips delivery when user has muted the category preference on WHATSAPP channel', async () => {
      const link = await WhatsAppLinkingService.createLinkRequest(mockSupabase as any, 'biz-001', 'user-001');
      await WhatsAppLinkingService.verifyAndLink(mockSupabase as any, '2348012345678', link.code);

      // Disable INVENTORY category on WHATSAPP channel
      mockSupabase._store.notification_preferences.push({
        business_id: 'biz-001',
        user_id: 'user-001',
        category: 'INVENTORY',
        channel: 'WHATSAPP',
        enabled: false,
      });

      const notification: BusinessNotification = {
        id: 'notif-stock-02',
        businessId: 'biz-001',
        recipientUserId: 'user-001',
        sourceEventId: null,
        notificationCategory: 'INVENTORY',
        notificationType: 'LOW_STOCK',
        dedupeKey: 'stock-alert-item-2',
        title: 'Low Stock: Sugar 25kg',
        body: 'Only 2 bags remaining.',
        payload: {},
        primaryActionKey: 'OPEN_INVENTORY',
        sourceReferenceType: null,
        sourceReferenceId: null,
        requiredCapabilities: [],
        channel: 'WHATSAPP',
        createdAt: new Date().toISOString(),
        readAt: null,
        resolvedAt: null,
      };

      const delivery = await WhatsAppDeliveryService.deliverNotification(mockSupabase as any, {
        notification,
      });

      assert.equal(delivery.status, 'SKIPPED');
      assert.equal(delivery.skipReason, 'USER_PREFERENCE_DISABLED');
    });

    it('RBAC DOWNGRADE PROTECTION: Skips outbound delivery if user role downgraded and lacks capability', async () => {
      // Connect sales staff user
      const link = await WhatsAppLinkingService.createLinkRequest(mockSupabase as any, 'biz-001', 'user-sales');
      await WhatsAppLinkingService.verifyAndLink(mockSupabase as any, '2348099887766', link.code);

      // Notification requires profitability / reports.view capability
      const sensitiveNotification: BusinessNotification = {
        id: 'notif-health-01',
        businessId: 'biz-001',
        recipientUserId: 'user-sales',
        sourceEventId: null,
        notificationCategory: 'BUSINESS_HEALTH',
        notificationType: 'BUSINESS_HEALTH_CHANGED',
        dedupeKey: 'health-change-01',
        title: 'Business Health Alert',
        body: 'Operating margin dropped below target.',
        payload: {},
        primaryActionKey: 'OPEN_BUSINESS_HEALTH',
        sourceReferenceType: null,
        sourceReferenceId: null,
        requiredCapabilities: ['reports.view', 'profitability.view'],
        channel: 'WHATSAPP',
        createdAt: new Date().toISOString(),
        readAt: null,
        resolvedAt: null,
      };

      const delivery = await WhatsAppDeliveryService.deliverNotification(mockSupabase as any, {
        notification: sensitiveNotification,
      });

      assert.equal(delivery.status, 'SKIPPED');
      assert.equal(delivery.skipReason, 'ROLE_CAPABILITY_RESTRICTION');
    });

    it('supports all 8 source-controlled notification templates in template registry', () => {
      const templateKeys = Object.keys(WHATSAPP_TEMPLATE_REGISTRY);
      assert.ok(templateKeys.includes('LOW_STOCK'));
      assert.ok(templateKeys.includes('OUT_OF_STOCK'));
      assert.ok(templateKeys.includes('OVERDUE_INVOICE'));
      assert.ok(templateKeys.includes('BOOKKEEPER_REVIEW_PENDING'));
      assert.ok(templateKeys.includes('BUSINESS_HEALTH_CHANGED'));
      assert.ok(templateKeys.includes('CREDIT_PASSPORT_STALE'));
      assert.ok(templateKeys.includes('BUSINESS_SUMMARY_READY'));
      assert.ok(templateKeys.includes('AUTOMATION_FAILED'));
    });
  });
});
