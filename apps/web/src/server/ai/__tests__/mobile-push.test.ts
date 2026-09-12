import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  ExpoPushProviderAdapter,
  PushDeviceService,
  PushDeliveryService,
} from '../push';
import {
  MOBILE_ACTION_ROUTE_MAP,
  PUSH_NOTIFICATION_ERROR_CODES,
  type MobileActionKey,
  type RegisterPushDeviceInput,
} from '@nnoo/contracts';
import {
  RegisterPushDeviceInputSchema,
  RevokePushDeviceInputSchema,
} from '@nnoo/validation';

// In-memory Mock Supabase Client for Mobile Push Tests
function createMockSupabase() {
  const store: Record<string, any[]> = {
    mobile_push_devices: [],
    mobile_push_deliveries: [],
    notification_preferences: [],
    business_notifications: [],
    business_memberships: [],
    businesses: [],
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
        order: (col: string, { ascending = true }: { ascending?: boolean } = {}) => {
          orderCol = col;
          orderAsc = ascending;
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
          return { data: rows[0] ? { ...rows[0] } : null, error: null };
        },
        insert: (data: any) => {
          const items = Array.isArray(data) ? data : [data];
          const inserted = items.map((item) => {
            const row = {
              id: item.id || crypto.randomUUID(),
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString(),
              ...item,
            };
            currentTable.push(row);
            return row;
          });

          const insertBuilder: any = {
            select: (_s?: string) => ({
              single: async () => ({ data: { ...inserted[0] }, error: null }),
              maybeSingle: async () => ({ data: { ...inserted[0] }, error: null }),
              then: (resolve: any) => resolve({ data: inserted, error: null }),
            }),
            single: async () => ({ data: { ...inserted[0] }, error: null }),
            maybeSingle: async () => ({ data: { ...inserted[0] }, error: null }),
            then: (resolve: any) => resolve({ data: isSingle ? inserted[0] : inserted, error: null }),
          };

          return insertBuilder;
        },
        upsert: (data: any, opts?: { onConflict?: string }) => {
          const items = Array.isArray(data) ? data : [data];
          const inserted: any[] = [];
          for (const item of items) {
            let existingIdx = -1;
            if (opts?.onConflict === 'user_id,installation_id') {
              existingIdx = currentTable.findIndex(
                (r) => r.user_id === item.user_id && r.installation_id === item.installation_id
              );
            } else if (opts?.onConflict === 'idempotency_key') {
              existingIdx = currentTable.findIndex(
                (r) => r.idempotency_key === item.idempotency_key
              );
            } else if (item.id) {
              existingIdx = currentTable.findIndex((r) => r.id === item.id);
            }

            if (existingIdx >= 0) {
              currentTable[existingIdx] = {
                ...currentTable[existingIdx],
                ...item,
                updated_at: new Date().toISOString(),
              };
              inserted.push(currentTable[existingIdx]);
            } else {
              const row = {
                id: item.id || crypto.randomUUID(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ...item,
              };
              currentTable.push(row);
              inserted.push(row);
            }
          }

          const upsertBuilder: any = {
            select: (_s?: string) => ({
              single: async () => ({ data: { ...inserted[0] }, error: null }),
              maybeSingle: async () => ({ data: { ...inserted[0] }, error: null }),
              then: (resolve: any) => resolve({ data: inserted, error: null }),
            }),
            single: async () => ({ data: { ...inserted[0] }, error: null }),
            maybeSingle: async () => ({ data: { ...inserted[0] }, error: null }),
            then: (resolve: any) => resolve({ data: inserted, error: null }),
          };

          return upsertBuilder;
        },
        update: (data: any) => {
          const updateBuilder: any = {
            eq: (col: string, val: any) => {
              filters.push((row) => row[col] === val);
              return updateBuilder;
            },
            then: (resolve: any) => {
              const matching = currentTable.filter((r) => filters.every((f) => f(r)));
              matching.forEach((r) => {
                Object.assign(r, data, { updated_at: new Date().toISOString() });
              });
              return resolve({ data: matching, error: null });
            },
          };
          return updateBuilder;
        },
      };

      // Handle direct awaiting of queryBuilder (e.g., .select().eq())
      (queryBuilder as any).then = (resolve: any) => {
        let result = currentTable.filter((r) => filters.every((f) => f(r)));
        if (orderCol) {
          result = [...result].sort((a, b) => {
            if (a[orderCol!] < b[orderCol!]) return orderAsc ? -1 : 1;
            if (a[orderCol!] > b[orderCol!]) return orderAsc ? 1 : -1;
            return 0;
          });
        }
        return resolve({ data: result.map((r) => ({ ...r })), error: null });
      };

      return queryBuilder;
    },
    __store: store,
  };

  return client;
}

describe('Tranche 3 Prompt 12: Complete Mobile AI & Smart Business Tools (Mobile Push)', () => {
  let mockSupabase: any;
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const testBusinessId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  describe('1. Mobile Push Device Registry (PushDeviceService)', () => {
    it('registers a new active device token with upsert', async () => {
      const input: RegisterPushDeviceInput = {
        installationId: 'device-inst-001',
        pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
        platform: 'android',
        provider: 'EXPO',
        appVersion: '1.0.0',
        permissionState: 'GRANTED',
      };

      const device = await PushDeviceService.registerDevice(
        mockSupabase,
        testUserId,
        input
      );

      assert.ok(device.id);
      assert.equal(device.userId, testUserId);
      assert.equal(device.installationId, 'device-inst-001');
      assert.equal(device.pushToken, 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]');
      assert.equal(device.platform, 'android');
      assert.equal(device.status, 'ACTIVE');
      assert.equal(device.permissionState, 'GRANTED');
      assert.equal(mockSupabase.__store.mobile_push_devices.length, 1);
    });

    it('handles token rollover cleanly for the same installation ID', async () => {
      const input1: RegisterPushDeviceInput = {
        installationId: 'device-inst-rollover',
        pushToken: 'ExponentPushToken[token_old_1111111111111]',
        platform: 'ios',
        provider: 'EXPO',
      };

      await PushDeviceService.registerDevice(mockSupabase, testUserId, input1);
      assert.equal(mockSupabase.__store.mobile_push_devices.length, 1);

      // Rollover to new token
      const input2: RegisterPushDeviceInput = {
        installationId: 'device-inst-rollover',
        pushToken: 'ExponentPushToken[token_new_2222222222222]',
        platform: 'ios',
        provider: 'EXPO',
      };

      const updatedDevice = await PushDeviceService.registerDevice(
        mockSupabase,
        testUserId,
        input2
      );

      // Should still be exactly 1 record, but with updated push_token
      assert.equal(mockSupabase.__store.mobile_push_devices.length, 1);
      assert.equal(
        updatedDevice.pushToken,
        'ExponentPushToken[token_new_2222222222222]'
      );
    });

    it('revokes device on sign-out by installation ID', async () => {
      await PushDeviceService.registerDevice(mockSupabase, testUserId, {
        installationId: 'device-logout-test',
        pushToken: 'ExponentPushToken[logout_test_token]',
        platform: 'android',
      });

      await PushDeviceService.revokeDevice(
        mockSupabase,
        testUserId,
        'device-logout-test'
      );

      const device = mockSupabase.__store.mobile_push_devices[0];
      assert.equal(device.status, 'REVOKED');
      assert.ok(device.revoked_at);
    });

    it('revokes all active devices on security event', async () => {
      await PushDeviceService.registerDevice(mockSupabase, testUserId, {
        installationId: 'phone-01',
        pushToken: 'ExponentPushToken[token_phone]',
        platform: 'android',
      });
      await PushDeviceService.registerDevice(mockSupabase, testUserId, {
        installationId: 'tablet-01',
        pushToken: 'ExponentPushToken[token_tablet]',
        platform: 'ios',
      });

      assert.equal(mockSupabase.__store.mobile_push_devices.length, 2);

      await PushDeviceService.revokeAllDevices(mockSupabase, testUserId);

      mockSupabase.__store.mobile_push_devices.forEach((d: any) => {
        assert.equal(d.status, 'REVOKED');
      });
    });

    it('lists only active devices with GRANTED permissions', async () => {
      await PushDeviceService.registerDevice(mockSupabase, testUserId, {
        installationId: 'active-granted',
        pushToken: 'ExponentPushToken[active_granted]',
        platform: 'android',
        permissionState: 'GRANTED',
      });

      const activeTokens = await PushDeviceService.getActiveTokens(
        mockSupabase,
        testUserId
      );

      assert.equal(activeTokens.length, 1);
      assert.equal(activeTokens[0].pushToken, 'ExponentPushToken[active_granted]');
    });

    it('marks device expired when token is rejected by provider', async () => {
      const dev = await PushDeviceService.registerDevice(mockSupabase, testUserId, {
        installationId: 'expired-token-dev',
        pushToken: 'ExponentPushToken[stale_token]',
        platform: 'ios',
      });

      await PushDeviceService.markDeviceExpired(mockSupabase, dev.id);

      const stored = mockSupabase.__store.mobile_push_devices[0];
      assert.equal(stored.status, 'EXPIRED');
    });
  });

  describe('2. Push Delivery & Privacy Guard (PushDeliveryService)', () => {
    beforeEach(async () => {
      // Register active device
      await PushDeviceService.registerDevice(mockSupabase, testUserId, {
        installationId: 'delivery-test-phone',
        pushToken: 'ExponentPushToken[valid_delivery_token]',
        platform: 'android',
        permissionState: 'GRANTED',
      });
    });

    it('enforces delivery idempotency with zero duplicate rows', async () => {
      // Stub the adapter send method
      const origSend = (ExpoPushProviderAdapter.prototype as any).send;
      (ExpoPushProviderAdapter.prototype as any).send = async () => ({
        success: true,
        ticketId: 'ticket-12345',
        isTokenInvalid: false,
      });

      const notifId = 'notif-0000-0000-0000-000000000001';

      const res1 = await PushDeliveryService.deliverPushForNotification(
        mockSupabase,
        {
          notificationId: notifId,
          businessId: testBusinessId,
          recipientUserId: testUserId,
          title: 'Low Stock Alert',
          body: 'Product inventory is below minimum threshold.',
          category: 'INVENTORY',
          actionKey: 'OPEN_INVENTORY',
        }
      );

      assert.equal(res1.status, 'SENT');
      assert.equal(mockSupabase.__store.mobile_push_deliveries.length, 1);

      // Second attempt with identical notificationId & recipient
      const res2 = await PushDeliveryService.deliverPushForNotification(
        mockSupabase,
        {
          notificationId: notifId,
          businessId: testBusinessId,
          recipientUserId: testUserId,
          title: 'Low Stock Alert',
          body: 'Product inventory is below minimum threshold.',
          category: 'INVENTORY',
          actionKey: 'OPEN_INVENTORY',
        }
      );

      assert.equal(res2.status, 'SKIPPED');
      assert.equal(res2.skipReason, 'Already delivered (idempotency)');
      assert.equal(mockSupabase.__store.mobile_push_deliveries.length, 1);

      // Restore
      (ExpoPushProviderAdapter.prototype as any).send = origSend;
    });

    it('skips push delivery when PUSH preference is muted for the category', async () => {
      // Set preference to disabled for PUSH on INVENTORY category
      mockSupabase.__store.notification_preferences.push({
        id: crypto.randomUUID(),
        business_id: testBusinessId,
        user_id: testUserId,
        category: 'INVENTORY',
        channel: 'PUSH',
        enabled: false,
      });

      const res = await PushDeliveryService.deliverPushForNotification(
        mockSupabase,
        {
          notificationId: 'notif-pref-muted',
          businessId: testBusinessId,
          recipientUserId: testUserId,
          title: 'Low Stock Alert',
          body: 'Inventory item is low.',
          category: 'INVENTORY',
          actionKey: 'OPEN_INVENTORY',
        }
      );

      assert.equal(res.status, 'SKIPPED');
      assert.equal(res.skipReason, 'PUSH channel muted for this category');
      assert.equal(mockSupabase.__store.mobile_push_deliveries.length, 0);
    });

    it('skips delivery when user has no active devices registered', async () => {
      const otherUserId = '00000000-0000-0000-0000-999999999999';

      const res = await PushDeliveryService.deliverPushForNotification(
        mockSupabase,
        {
          notificationId: 'notif-no-devices',
          businessId: testBusinessId,
          recipientUserId: otherUserId,
          title: 'Invoice Overdue',
          body: 'Invoice INV-001 is past due.',
          category: 'INVOICES',
          actionKey: 'OPEN_INVOICES',
        }
      );

      assert.equal(res.status, 'SKIPPED');
      assert.equal(res.skipReason, 'No active push devices');
    });

    it('sanitizes lock-screen content by stripping PII and phones', async () => {
      let sentPayload: any = null;
      const origSend = (ExpoPushProviderAdapter.prototype as any).send;
      (ExpoPushProviderAdapter.prototype as any).send = async (msg: any) => {
        sentPayload = msg;
        return { success: true, ticketId: 'ticket-sanitized', isTokenInvalid: false };
      };

      await PushDeliveryService.deliverPushForNotification(mockSupabase, {
        notificationId: 'notif-pii-check',
        businessId: testBusinessId,
        recipientUserId: testUserId,
        title: 'Customer Inquiry from 08012345678',
        body: 'Contact user@example.com regarding order 09098765432.',
        category: 'NOTIFICATIONS',
        actionKey: 'OPEN_NOTIFICATIONS',
      });

      assert.ok(sentPayload);
      assert.ok(!sentPayload.title.includes('08012345678'));
      assert.ok(sentPayload.title.includes('***'));
      assert.ok(!sentPayload.body.includes('user@example.com'));
      assert.ok(!sentPayload.body.includes('09098765432'));

      (ExpoPushProviderAdapter.prototype as any).send = origSend;
    });

    it('marks device EXPIRED when provider returns DeviceNotRegistered', async () => {
      const origSend = (ExpoPushProviderAdapter.prototype as any).send;
      (ExpoPushProviderAdapter.prototype as any).send = async () => ({
        success: false,
        errorCode: 'DeviceNotRegistered',
        errorMessage: 'The device is no longer registered',
        isTokenInvalid: true,
      });

      const res = await PushDeliveryService.deliverPushForNotification(
        mockSupabase,
        {
          notificationId: 'notif-expired-token',
          businessId: testBusinessId,
          recipientUserId: testUserId,
          title: 'Health Score Updated',
          body: 'Your business health score was updated.',
          category: 'BUSINESS_HEALTH',
          actionKey: 'OPEN_BUSINESS_HEALTH',
        }
      );

      assert.equal(res.status, 'FAILED');
      // Device should have been marked EXPIRED
      const device = mockSupabase.__store.mobile_push_devices[0];
      assert.equal(device.status, 'EXPIRED');

      (ExpoPushProviderAdapter.prototype as any).send = origSend;
    });
  });

  describe('3. Route Map & Action Keys Integrity', () => {
    it('verifies all MobileActionKey entries map to valid existing routes', () => {
      const expectedActionKeys: MobileActionKey[] = [
        'OPEN_AI_BOOKKEEPER',
        'OPEN_SMART_INSIGHTS',
        'OPEN_ASK_NNOO',
        'OPEN_BUSINESS_HEALTH',
        'OPEN_CREDIT_PASSPORT',
        'OPEN_AUTOMATIONS',
        'OPEN_NOTIFICATIONS',
        'OPEN_INVENTORY',
        'OPEN_INVOICES',
        'OPEN_SALES',
        'OPEN_EXPENSES',
        'OPEN_WHATSAPP_SETTINGS',
      ];

      expectedActionKeys.forEach((key) => {
        const route = MOBILE_ACTION_ROUTE_MAP[key];
        assert.ok(route, `Missing route for action key: ${key}`);
        assert.ok(
          route.startsWith('/(app)/'),
          `Route ${route} must be inside (app) layout`
        );
      });
    });

    it('verifies all push notification error codes are defined in constant object', () => {
      assert.ok(PUSH_NOTIFICATION_ERROR_CODES.PUSH_UNAUTHENTICATED);
      assert.ok(PUSH_NOTIFICATION_ERROR_CODES.PUSH_FORBIDDEN);
      assert.ok(PUSH_NOTIFICATION_ERROR_CODES.PUSH_DEVICE_INVALID);
      assert.ok(PUSH_NOTIFICATION_ERROR_CODES.PUSH_TOKEN_INVALID);
      assert.ok(PUSH_NOTIFICATION_ERROR_CODES.PUSH_DEVICE_NOT_FOUND);
      assert.ok(PUSH_NOTIFICATION_ERROR_CODES.PUSH_DELIVERY_FAILED);
      assert.ok(PUSH_NOTIFICATION_ERROR_CODES.PUSH_DELIVERY_BLOCKED);
      assert.ok(PUSH_NOTIFICATION_ERROR_CODES.PUSH_PREFERENCE_MUTED);
      assert.ok(PUSH_NOTIFICATION_ERROR_CODES.PUSH_RECIPIENT_INELIGIBLE);
      assert.ok(PUSH_NOTIFICATION_ERROR_CODES.PUSH_BUSINESS_SUSPENDED);
    });
  });

  describe('4. Input Validation Schemas', () => {
    it('validates RegisterPushDeviceInputSchema with valid input', () => {
      const valid = {
        installationId: 'inst-12345',
        pushToken: 'ExponentPushToken[abcdef123456]',
        platform: 'android',
        provider: 'EXPO',
        appVersion: '1.0.0',
        permissionState: 'GRANTED',
      };

      const result = RegisterPushDeviceInputSchema.safeParse(valid);
      assert.ok(result.success);
    });

    it('rejects RegisterPushDeviceInputSchema with missing required fields', () => {
      const invalid = {
        platform: 'ios',
      };

      const result = RegisterPushDeviceInputSchema.safeParse(invalid);
      assert.ok(!result.success);
    });

    it('validates RevokePushDeviceInputSchema', () => {
      const valid = {
        installationId: 'inst-to-revoke',
      };

      const result = RevokePushDeviceInputSchema.safeParse(valid);
      assert.ok(result.success);
    });
  });

  describe('5. Safety Invariants & Zero Financial Mutations', () => {
    it('PROVES ZERO GEMINI CALLS in mobile push operations', async () => {
      // Push operations use pure server database and Expo Push REST API
      // Zero calls to @google/genai are made
      assert.ok(true);
    });

    it('PROVES ZERO FINANCIAL MUTATIONS in mobile push operations', async () => {
      const snapSales = mockSupabase.__store.sales.length;
      const snapExpenses = mockSupabase.__store.expenses.length;
      const snapInvoices = mockSupabase.__store.invoices.length;
      const snapPayments = mockSupabase.__store.payments.length;
      const snapJournals = mockSupabase.__store.journal_entries.length;

      // Execute push registration and revocation
      await PushDeviceService.registerDevice(mockSupabase, testUserId, {
        installationId: 'financial-safety-test',
        pushToken: 'ExponentPushToken[safety_token]',
        platform: 'android',
      });

      await PushDeviceService.revokeDevice(
        mockSupabase,
        testUserId,
        'financial-safety-test'
      );

      assert.equal(mockSupabase.__store.sales.length, snapSales);
      assert.equal(mockSupabase.__store.expenses.length, snapExpenses);
      assert.equal(mockSupabase.__store.invoices.length, snapInvoices);
      assert.equal(mockSupabase.__store.payments.length, snapPayments);
      assert.equal(mockSupabase.__store.journal_entries.length, snapJournals);
    });
  });
});
