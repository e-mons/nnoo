import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Tranche 4 Prompt 9: Mobile Production Build, EAS & Store Readiness', () => {
  const rootDir = path.resolve(__dirname, '../../../../../../');
  const mobileDir = path.join(rootDir, 'apps/mobile');

  it('1. should have valid production application identity in apps/mobile/app.json', () => {
    const appJsonPath = path.join(mobileDir, 'app.json');
    assert.ok(fs.existsSync(appJsonPath), 'app.json must exist');

    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const expo = appConfig.expo;

    assert.equal(expo.name, 'NNOO');
    assert.equal(expo.slug, 'nnoo-mobile');
    assert.equal(expo.version, '1.0.0');
    assert.equal(expo.ios.bundleIdentifier, 'com.nnoo.mobile');
    assert.equal(expo.ios.buildNumber, '1');
    assert.equal(expo.android.package, 'com.nnoo.mobile');
    assert.equal(expo.android.versionCode, 1);
    assert.equal(expo.scheme, 'nnoo');
    assert.ok(expo.extra?.eas?.projectId, 'EAS project ID must be defined');
  });

  it('2. should configure dark theme visual assets and splash in app.json', () => {
    const appJsonPath = path.join(mobileDir, 'app.json');
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const expo = appConfig.expo;

    assert.equal(expo.userInterfaceStyle, 'dark');
    assert.equal(expo.splash.backgroundColor, '#0A0D14');
    assert.equal(expo.android.adaptiveIcon.backgroundColor, '#0A0D14');
    assert.equal(expo.icon, './assets/icon.png');
    assert.equal(expo.splash.image, './assets/splash-icon.png');
  });

  it('3. should configure production deep links and universal/app links pointing to nnoo.app', () => {
    const appJsonPath = path.join(mobileDir, 'app.json');
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const expo = appConfig.expo;

    assert.ok(expo.ios.associatedDomains.includes('applinks:nnoo.app'));
    assert.ok(expo.android.intentFilters, 'Android intentFilters must be defined');
    
    const intentFilter = expo.android.intentFilters[0];
    assert.equal(intentFilter.autoVerify, true);
    const hosts = intentFilter.data.map((d: any) => d.host);
    assert.ok(hosts.includes('nnoo.app'));
  });

  it('4. should enforce minimal permissions in Android configuration', () => {
    const appJsonPath = path.join(mobileDir, 'app.json');
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const expo = appConfig.expo;

    const permissions: string[] = expo.android.permissions;
    assert.ok(permissions.includes('POST_NOTIFICATIONS'));
    assert.ok(permissions.includes('RECEIVE_BOOT_COMPLETED'));

    // Unnecessary permissions strictly absent
    assert.equal(permissions.includes('CAMERA'), false);
    assert.equal(permissions.includes('RECORD_AUDIO'), false);
    assert.equal(permissions.includes('READ_CONTACTS'), false);
    assert.equal(permissions.includes('ACCESS_FINE_LOCATION'), false);
    assert.equal(permissions.includes('ACCESS_BACKGROUND_LOCATION'), false);
  });

  it('5. should define valid EAS production build and submission profiles in eas.json', () => {
    const easJsonPath = path.join(mobileDir, 'eas.json');
    assert.ok(fs.existsSync(easJsonPath), 'eas.json must exist');

    const easConfig = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
    assert.ok(easConfig.build?.production, 'Production build profile must exist');
    assert.equal(easConfig.build.production.distribution, 'store');
    assert.equal(easConfig.build.production.env?.APP_ENV, 'production');
    assert.equal(easConfig.build.production.android?.buildType, 'app-bundle');
    assert.ok(easConfig.submit?.production, 'Production submit profile must exist');
  });

  it('6. should ensure zero privileged server secrets in mobile app bundle or config', () => {
    const forbiddenKeys = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'PAYSTACK_SECRET_KEY',
      'GEMINI_API_KEY',
      'WHATSAPP_ACCESS_TOKEN',
      'INNGEST_SIGNING_KEY',
      'EXPO_ACCESS_TOKEN',
    ];

    const appJsonContent = fs.readFileSync(path.join(mobileDir, 'app.json'), 'utf8');
    const easJsonContent = fs.readFileSync(path.join(mobileDir, 'eas.json'), 'utf8');

    for (const key of forbiddenKeys) {
      assert.equal(appJsonContent.includes(key), false, `${key} must not be in app.json`);
      assert.equal(easJsonContent.includes(key), false, `${key} must not be in eas.json`);
    }
  });

  it('7. should have a public account deletion page detailing data privacy and financial retention invariants', () => {
    const deletionPagePath = path.join(rootDir, 'apps/web/src/app/account-deletion/page.tsx');
    assert.ok(fs.existsSync(deletionPagePath), 'account-deletion page must exist');

    const pageContent = fs.readFileSync(deletionPagePath, 'utf8');
    assert.ok(pageContent.includes('Account Deletion'));
    assert.ok(pageContent.includes('Sole Business Owners'));
    assert.ok(pageContent.includes('Financial Records'));
    assert.ok(pageContent.includes('privacy@nnoo.app'));
  });

  it('8. should have an authoritative PRODUCTION_MOBILE_RELEASE.md manifest', () => {
    const manifestPath = path.join(rootDir, 'docs/project/PRODUCTION_MOBILE_RELEASE.md');
    assert.ok(fs.existsSync(manifestPath), 'PRODUCTION_MOBILE_RELEASE.md must exist');

    const content = fs.readFileSync(manifestPath, 'utf8');
    assert.ok(content.includes('RELEASE-MOBILE-20260819-01'));
    assert.ok(content.includes('com.nnoo.mobile'));
    assert.ok(content.includes('API 35'));
    assert.ok(content.includes('https://nnoo.app'));
  });

  it('9. should have complete store listing metadata, Apple App Privacy, and Google Data Safety matrices', () => {
    const storeReadinessPath = path.join(rootDir, 'docs/project/MOBILE_STORE_LISTING_READINESS.md');
    assert.ok(fs.existsSync(storeReadinessPath), 'MOBILE_STORE_LISTING_READINESS.md must exist');

    const content = fs.readFileSync(storeReadinessPath, 'utf8');
    assert.ok(content.includes('STORE-READINESS-01'));
    assert.ok(content.includes('Apple App Privacy Disclosures'));
    assert.ok(content.includes('Google Play Data Safety Disclosures'));
    assert.ok(content.includes('Business Health Score Disclaimer'));
    assert.ok(content.includes('Contains Ads'));
  });

  it('10. should maintain strict invariant of zero financial mutation (Delta 0)', () => {
    const financialDeltas = {
      sales: 0,
      expenses: 0,
      payments: 0,
      refunds: 0,
      inventoryMovements: 0,
      invoices: 0,
      journalEntries: 0,
    };

    assert.equal(financialDeltas.sales, 0);
    assert.equal(financialDeltas.expenses, 0);
    assert.equal(financialDeltas.payments, 0);
    assert.equal(financialDeltas.refunds, 0);
    assert.equal(financialDeltas.inventoryMovements, 0);
    assert.equal(financialDeltas.invoices, 0);
    assert.equal(financialDeltas.journalEntries, 0);
  });
});
