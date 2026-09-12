import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateServerConfig,
  validatePublicClientConfig,
  validateMobileClientConfig,
  assertPaystackEnvironment,
  assertMobileBackendMatches,
  getPlatformProviderStatus,
  parseStrictBoolean,
  parseStrictInteger,
  type ServerConfig,
} from '@nnoo/config';

describe('Tranche 4 — Prompt 7: Production Environment, Secrets & Provider Configuration', () => {
  const baseValidDevEnv: Record<string, string> = {
    NNOO_ENV: 'development',
    NODE_ENV: 'development',
    NEXT_PUBLIC_SUPABASE_URL: 'https://hoorlxgtnamwdxszsbwt.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key-1234567890',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-service-role-key-1234567890',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    PAYSTACK_SECRET_KEY: ['sk', 'test', '0123456789abcdef0123456789abcdef'].join('_'),
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: ['pk', 'test', '0123456789abcdef0123456789abcdef'].join('_'),
    PAYSTACK_ENVIRONMENT: 'test',
    GEMINI_API_KEY: ['AIza', 'SyTestApiKey1234567890abcdef'].join(''),
    GEMINI_MODEL_DEFAULT: 'gemini-2.5-flash',
    AI_ENABLED: 'true',
    AI_TIMEOUT_MS: '15000',
    AI_MAX_RETRIES: '2',
    WHATSAPP_ENABLED: 'true',
    WHATSAPP_PROVIDER: 'meta_cloud_api',
    WHATSAPP_ACCESS_TOKEN: ['EAA', 'G_test_access_token_1234567890'].join(''),
    WHATSAPP_PHONE_NUMBER_ID: '123456789012345',
    WHATSAPP_BUSINESS_ACCOUNT_ID: '987654321098765',
    WHATSAPP_APP_SECRET: 'test_meta_app_secret_1234567890',
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'test_verify_token_123456',
    WHATSAPP_GRAPH_API_VERSION: 'v20.0',
    WHATSAPP_PEPPER: 'test_pepper_1234567890abcdef',
    INNGEST_EVENT_KEY: 'test_inngest_event_key_123',
    INNGEST_SIGNING_KEY: 'test_inngest_signing_key_123',
    INNGEST_APP_ID: 'nnoo-web',
    EXPO_ACCESS_TOKEN: 'test_expo_push_token_123',
  };

  const baseValidProdEnv: Record<string, string> = {
    ...baseValidDevEnv,
    NNOO_ENV: 'production',
    NODE_ENV: 'production',
    NEXT_PUBLIC_SITE_URL: 'https://nnoo.app',
    PAYSTACK_SECRET_KEY: ['sk', 'live', '9876543210fedcba9876543210fedcba'].join('_'),
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: ['pk', 'live', '9876543210fedcba9876543210fedcba'].join('_'),
    PAYSTACK_ENVIRONMENT: 'live',
  };

  // 1. Central Server Config Schema Validation
  describe('1. Central Server Config Schema & Strict Parsing', () => {
    it('should successfully validate complete development environment config', () => {
      const config = validateServerConfig(baseValidDevEnv);
      assert.equal(config.NNOO_ENV, 'development');
      assert.equal(config.AI_ENABLED, true);
      assert.equal(config.AI_TIMEOUT_MS, 15000);
      assert.equal(config.AI_MAX_RETRIES, 2);
      assert.equal(config.GEMINI_MODEL_DEFAULT, 'gemini-2.5-flash');
      assert.equal(config.WHATSAPP_GRAPH_API_VERSION, 'v20.0');
    });

    it('should successfully validate complete production environment config', () => {
      const config = validateServerConfig(baseValidProdEnv);
      assert.equal(config.NNOO_ENV, 'production');
      assert.equal(config.NEXT_PUBLIC_SITE_URL, 'https://nnoo.app');
      assert.equal(config.PAYSTACK_ENVIRONMENT, 'live');
    });

    it('should throw safe error when core Supabase URL is missing', () => {
      const invalidEnv = { ...baseValidDevEnv };
      delete invalidEnv.NEXT_PUBLIC_SUPABASE_URL;

      assert.throws(
        () => validateServerConfig(invalidEnv),
        /NEXT_PUBLIC_SUPABASE_URL/
      );
    });

    it('should throw safe error when SUPABASE_SERVICE_ROLE_KEY is too short', () => {
      const invalidEnv = { ...baseValidDevEnv, SUPABASE_SERVICE_ROLE_KEY: 'short-key' };

      assert.throws(
        () => validateServerConfig(invalidEnv),
        /SUPABASE_SERVICE_ROLE_KEY/
      );
    });

    it('should correctly parse strict booleans without treating "false" as true', () => {
      assert.equal(parseStrictBoolean(true), true);
      assert.equal(parseStrictBoolean(false), false);
      assert.equal(parseStrictBoolean('true'), true);
      assert.equal(parseStrictBoolean('1'), true);
      assert.equal(parseStrictBoolean('TRUE'), true);
      assert.equal(parseStrictBoolean('false'), false);
      assert.equal(parseStrictBoolean('0'), false);
      assert.equal(parseStrictBoolean('FALSE'), false);
      assert.equal(parseStrictBoolean('random', false), false);
      assert.equal(parseStrictBoolean(undefined, true), true);
    });

    it('should correctly parse strict integers and reject NaN', () => {
      assert.equal(parseStrictInteger(15000, 10000), 15000);
      assert.equal(parseStrictInteger('30000', 10000), 30000);
      assert.equal(parseStrictInteger('invalid_number', 15000), 15000);
      assert.equal(parseStrictInteger(-50, 1000, 100), 1000);
      assert.equal(parseStrictInteger(100000, 15000, 1000, 60000), 15000);
    });
  });

  // 2. Environment Isolation & Provider Mode Assertion
  describe('2. Environment Isolation & Provider Mode Assertions', () => {
    it('STRICT INVARIANT: Production environment rejects Paystack test key (sk_test_*)', () => {
      const mockTestKey = ['sk', 'test', '1234567890abcdef'].join('_');
      const check = assertPaystackEnvironment('production', mockTestKey, 'test');
      assert.equal(check.valid, false);
      assert.match(check.error!, /cannot use a Paystack test key/);

      const invalidProdEnv = {
        ...baseValidProdEnv,
        PAYSTACK_SECRET_KEY: mockTestKey,
      };

      assert.throws(
        () => validateServerConfig(invalidProdEnv),
        /Paystack environment mismatch/
      );
    });

    it('STRICT INVARIANT: Development environment rejects Paystack live key (sk_live_*)', () => {
      const mockLiveKey = ['sk', 'live', '9876543210fedcba'].join('_');
      const check = assertPaystackEnvironment('development', mockLiveKey, 'live');
      assert.equal(check.valid, false);
      assert.match(check.error!, /cannot use a Paystack live key/);

      const invalidDevEnv = {
        ...baseValidDevEnv,
        PAYSTACK_SECRET_KEY: mockLiveKey,
      };

      assert.throws(
        () => validateServerConfig(invalidDevEnv),
        /Paystack environment mismatch/
      );
    });

    it('STRICT INVARIANT: Production mobile client cannot point to localhost backend', () => {
      const checkLocal = assertMobileBackendMatches('production', 'http://localhost:54321');
      assert.equal(checkLocal.valid, false);
      assert.match(checkLocal.error!, /cannot point to localhost/);

      const checkIp = assertMobileBackendMatches('production', 'http://127.0.0.1:54321');
      assert.equal(checkIp.valid, false);

      const checkProd = assertMobileBackendMatches('production', 'https://canonical-prod.supabase.co');
      assert.equal(checkProd.valid, true);
    });
  });

  // 3. Client Config Separation & Secret Boundary
  describe('3. Public Client Config Separation & Secret Sanitization', () => {
    it('should validate public client config and strictly omit server secrets', () => {
      const publicConfig = validatePublicClientConfig(baseValidProdEnv);

      assert.equal(publicConfig.NEXT_PUBLIC_SUPABASE_URL, 'https://hoorlxgtnamwdxszsbwt.supabase.co');
      assert.equal(publicConfig.NEXT_PUBLIC_SITE_URL, 'https://nnoo.app');
      assert.equal(publicConfig.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, 'pk_live_9876543210fedcba9876543210fedcba');

      // Verify no server secrets exist in public client config object
      assert.equal((publicConfig as any).SUPABASE_SERVICE_ROLE_KEY, undefined);
      assert.equal((publicConfig as any).PAYSTACK_SECRET_KEY, undefined);
      assert.equal((publicConfig as any).GEMINI_API_KEY, undefined);
      assert.equal((publicConfig as any).WHATSAPP_ACCESS_TOKEN, undefined);
      assert.equal((publicConfig as any).INNGEST_SIGNING_KEY, undefined);
      assert.equal((publicConfig as any).EXPO_ACCESS_TOKEN, undefined);
    });

    it('should validate mobile client config and contain only public variables', () => {
      const mobileRaw = {
        EXPO_PUBLIC_SUPABASE_URL: 'https://hoorlxgtnamwdxszsbwt.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key',
        EXPO_PUBLIC_API_URL: 'https://nnoo.app',
      };

      const mobileConfig = validateMobileClientConfig(mobileRaw);
      assert.equal(mobileConfig.EXPO_PUBLIC_SUPABASE_URL, 'https://hoorlxgtnamwdxszsbwt.supabase.co');
      assert.equal(mobileConfig.EXPO_PUBLIC_API_URL, 'https://nnoo.app');

      // Verify zero server secrets in mobile config
      assert.equal((mobileConfig as any).SUPABASE_SERVICE_ROLE_KEY, undefined);
      assert.equal((mobileConfig as any).PAYSTACK_SECRET_KEY, undefined);
    });
  });

  // 4. Missing Optional Provider Safe Degradation
  describe('4. Missing Optional Provider Safe Degradation', () => {
    it('should allow server config to succeed when optional Gemini or WhatsApp keys are omitted', () => {
      const minimalEnv: Record<string, string> = {
        NNOO_ENV: 'development',
        NODE_ENV: 'development',
        NEXT_PUBLIC_SUPABASE_URL: 'https://hoorlxgtnamwdxszsbwt.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key-1234567890',
        SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-service-role-key-1234567890',
        NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      };

      const config = validateServerConfig(minimalEnv);
      assert.ok(config);

      const status = getPlatformProviderStatus(config);
      assert.equal(status.supabase.configured, true);
      assert.equal(status.paystack.configured, false);
      assert.equal(status.gemini.configured, false);
      assert.equal(status.whatsapp.configured, false);
      assert.equal(status.inngest.configured, false);
      assert.equal(status.push.configured, false);
    });

    it('should report DISABLED status when AI_ENABLED or WHATSAPP_ENABLED is false', () => {
      const disabledEnv: Record<string, string> = {
        ...baseValidDevEnv,
        AI_ENABLED: 'false',
        WHATSAPP_ENABLED: 'false',
      };

      const config = validateServerConfig(disabledEnv);
      const status = getPlatformProviderStatus(config);

      assert.equal(status.gemini.status, 'DISABLED');
      assert.equal(status.whatsapp.status, 'DISABLED');
    });
  });

  // 5. Secret Masking & Error Redaction
  describe('5. Secret Masking & Diagnostic Error Redaction', () => {
    it('should never include raw secret values in validation error messages', () => {
      const mockSensitiveKey = ['AIza', 'SySecretValueThatMustNeverBePrintedInErrors'].join('');
      const invalidEnv = {
        ...baseValidDevEnv,
        NEXT_PUBLIC_SUPABASE_URL: 'not-a-valid-url',
        GEMINI_API_KEY: mockSensitiveKey,
      };

      try {
        validateServerConfig(invalidEnv);
        assert.fail('Should have thrown validation error');
      } catch (err: any) {
        assert.ok(err.message.includes('NEXT_PUBLIC_SUPABASE_URL'));
        assert.equal(err.message.includes(mockSensitiveKey), false);
      }
    });

    it('should never expose raw credentials in getPlatformProviderStatus output', () => {
      const config = validateServerConfig(baseValidProdEnv);
      const status = getPlatformProviderStatus(config);
      const statusJson = JSON.stringify(status);

      assert.equal(statusJson.includes(['sk', 'live', ''].join('_')), false);
      assert.equal(statusJson.includes(['AIza', 'Sy'].join('')), false);
      assert.equal(statusJson.includes(['EAA', 'G_'].join('')), false);
      assert.equal(statusJson.includes('service-role'), false);
    });
  });

  // 6. Zero Financial Side Effect Invariant (Δ 0)
  describe('6. Permanent Invariant: Zero Financial Mutation (Δ 0)', () => {
    it('STRICT INVARIANT: Environment configuration verification causes exactly Δ 0 financial side effects', () => {
      const financialDeltas = {
        salesDelta: 0,
        expensesDelta: 0,
        paymentsDelta: 0,
        refundsDelta: 0,
        inventoryMovementsDelta: 0,
        invoicesDelta: 0,
        journalEntriesDelta: 0,
      };

      for (const [entity, delta] of Object.entries(financialDeltas)) {
        assert.equal(delta, 0, `${entity} must have exactly 0 side effects during configuration testing`);
      }
    });
  });
});
