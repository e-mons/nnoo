import 'server-only';
import { getServerConfig } from '@/server/config';

export interface SendTransactionalEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendTransactionalEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Dispatches a transactional email via Resend API.
 * Uses RESEND_API_KEY from server environment configuration.
 * Gracefully logs and reports in testing/unconfigured environments.
 */
export async function sendTransactionalEmail(
  options: SendTransactionalEmailOptions
): Promise<SendTransactionalEmailResult> {
  const config = getServerConfig();
  const apiKey = config.RESEND_API_KEY || process.env.RESEND_API_KEY;

  if (!apiKey || apiKey === 're_your_api_key_here') {
    console.warn(
      `[Email Service] RESEND_API_KEY is not configured or using placeholder. Skipped email dispatch to: ${
        Array.isArray(options.to) ? options.to.join(', ') : options.to
      }`
    );
    return {
      success: false,
      error: 'RESEND_API_KEY is unconfigured in current environment.',
    };
  }

  const fromAddress = options.from || 'NNOO <onboarding@resend.dev>';
  const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: toAddresses,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Email Service] Resend API error:', data);
      return {
        success: false,
        error: data.message || 'Failed to dispatch email via Resend.',
      };
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown email dispatch error';
    console.error('[Email Service] Network/dispatch error:', message);
    return {
      success: false,
      error: message,
    };
  }
}
