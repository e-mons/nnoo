import 'server-only';
import crypto from 'crypto';
import { getWhatsAppConfig, type WhatsAppConfig } from './config';
import { AISafeError } from '../service';

export interface SendWhatsAppTemplateParams {
  recipientPhone: string;
  templateName: string;
  languageCode?: string;
  components?: Array<{
    type: 'header' | 'body' | 'button';
    sub_type?: string;
    index?: string;
    parameters: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
      text?: string;
      currency?: { fallback_value: string; code: string; amount_1000: number };
      date_time?: { fallback_value: string };
    }>;
  }>;
}

export interface SendWhatsAppTextParams {
  recipientPhone: string;
  body: string;
  previewUrl?: boolean;
}

export interface WhatsAppSendResult {
  providerMessageId: string;
  status: 'sent' | 'queued';
}

export class WhatsAppProviderAdapter {
  private config: WhatsAppConfig;
  private customFetch?: typeof fetch;

  constructor(customConfig?: Partial<WhatsAppConfig>, customFetch?: typeof fetch) {
    this.config = { ...getWhatsAppConfig(), ...customConfig };
    this.customFetch = customFetch;
  }

  /**
   * Normalizes raw international phone number string to digits without + or formatting.
   * Example: "+234 (801) 234-5678" -> "2348012345678"
   */
  public static normalizePhoneNumber(rawPhone: string): string {
    const digits = rawPhone.replace(/\D/g, '');
    // If starts with 0 (local Nigerian number e.g. 08012345678), convert to 2348012345678
    if (digits.startsWith('0') && digits.length === 11) {
      return `234${digits.slice(1)}`;
    }
    return digits;
  }

  /**
   * Masks a phone number for safe display in UI/logs.
   * Example: "2348012345678" -> "+234 *** *** 5678"
   */
  public static maskPhoneNumber(rawPhone: string): string {
    const normalized = WhatsAppProviderAdapter.normalizePhoneNumber(rawPhone);
    if (normalized.length < 7) {
      return '***';
    }
    const countryCode = normalized.slice(0, 3);
    const lastDigits = normalized.slice(-4);
    return `+${countryCode} *** *** ${lastDigits}`;
  }

  /**
   * Computes a cryptographic HMAC-SHA256 lookup key for sender phone numbers
   * to allow instant DB lookups without storing plaintext phone numbers in unindexed fields.
   */
  public static computePhoneLookupKey(phone: string, pepper?: string): string {
    const normalized = WhatsAppProviderAdapter.normalizePhoneNumber(phone);
    const secret = pepper || getWhatsAppConfig().pepper;
    return crypto.createHmac('sha256', secret).update(normalized).digest('hex');
  }

  /**
   * Verifies the HMAC-SHA256 signature from Meta webhook headers against the raw body bytes.
   */
  public verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string | null): boolean {
    if (!signatureHeader) {
      return false;
    }

    const appSecret = this.config.appSecret;
    if (!appSecret) {
      // In dev or test without secret, fail-closed for security
      return false;
    }

    const [scheme, signature] = signatureHeader.split('=');
    if (scheme !== 'sha256' || !signature) {
      return false;
    }

    try {
      const hmac = crypto.createHmac('sha256', appSecret);
      hmac.update(rawBody);
      const expectedSignature = hmac.digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      const actualBuffer = Buffer.from(signature, 'hex');

      if (expectedBuffer.length !== actualBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Sends a pre-approved WhatsApp Template Message via Meta Graph API.
   */
  public async sendTemplateMessage(params: SendWhatsAppTemplateParams): Promise<WhatsAppSendResult> {
    const normalizedPhone = WhatsAppProviderAdapter.normalizePhoneNumber(params.recipientPhone);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedPhone,
      type: 'template',
      template: {
        name: params.templateName,
        language: {
          code: params.languageCode || 'en',
        },
        components: params.components || [],
      },
    };

    return this.dispatchToMeta(payload);
  }

  /**
   * Sends a freeform text message via Meta Graph API (within 24h conversation window).
   */
  public async sendTextMessage(params: SendWhatsAppTextParams): Promise<WhatsAppSendResult> {
    const normalizedPhone = WhatsAppProviderAdapter.normalizePhoneNumber(params.recipientPhone);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedPhone,
      type: 'text',
      text: {
        preview_url: params.previewUrl ?? false,
        body: params.body,
      },
    };

    return this.dispatchToMeta(payload);
  }

  /**
   * Internal dispatcher to Meta Graph API endpoint.
   */
  private async dispatchToMeta(payload: Record<string, unknown>): Promise<WhatsAppSendResult> {
    const fetchImpl = this.customFetch || globalThis.fetch;

    if (!this.config.accessToken || !this.config.phoneNumberId) {
      // In development or test environments where credentials aren't live
      const mockId = `wamid.mock_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      return {
        providerMessageId: mockId,
        status: 'sent',
      };
    }

    const url = `${this.config.baseUrl}/messages`;

    try {
      const response = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error?.message || response.statusText;
        throw new AISafeError(
          'AI_PROVIDER_UNAVAILABLE',
          `Meta WhatsApp API error (${response.status}): ${message}`,
          true
        );
      }

      const data = await response.json();
      const messageId = data?.messages?.[0]?.id || `wamid.unknown_${Date.now()}`;

      return {
        providerMessageId: messageId,
        status: 'sent',
      };
    } catch (err: unknown) {
      if (err instanceof AISafeError) throw err;
      throw new AISafeError(
        'AI_PROVIDER_UNAVAILABLE',
        `Failed to reach Meta WhatsApp API: ${(err as Error).message}`,
        true
      );
    }
  }
}
