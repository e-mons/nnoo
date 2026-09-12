import 'server-only';

export interface WhatsAppConfig {
  enabled: boolean;
  provider: string;
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  appSecret: string;
  webhookVerifyToken: string;
  graphApiVersion: string;
  pepper: string;
  baseUrl: string;
}

/**
 * Server-only WhatsApp configuration.
 * Never leaks to client bundles or browser.
 */
export function getWhatsAppConfig(): WhatsAppConfig {
  const enabledEnv = process.env.WHATSAPP_ENABLED;
  const enabled = enabledEnv === 'true' || enabledEnv === '1';
  const provider = process.env.WHATSAPP_PROVIDER || 'meta_cloud_api';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
  const appSecret = process.env.WHATSAPP_APP_SECRET || '';
  const webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
  const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || 'v20.0';
  const pepper = process.env.WHATSAPP_PEPPER || 'nnoo-default-whatsapp-pepper-salt-2026';
  const baseUrl = `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}`;

  return {
    enabled,
    provider,
    accessToken,
    phoneNumberId,
    businessAccountId,
    appSecret,
    webhookVerifyToken,
    graphApiVersion,
    pepper,
    baseUrl,
  };
}
