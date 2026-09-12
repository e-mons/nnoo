import 'server-only';

/**
 * ExpoPushProviderAdapter — Server-side Expo Push API client.
 *
 * Sends push notifications via the Expo Push API v2.
 * Handles ticket responses, token error normalization, and
 * invalid token deactivation signals.
 *
 * Zero Expo SDK on mobile — all push dispatch is server-authoritative.
 */

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  categoryId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;          // Ticket ID for receipt checking
  message?: string;
  details?: {
    error?: 'DeviceNotRegistered' | 'InvalidCredentials' | 'MessageTooBig' | 'MessageRateExceeded' | string;
  };
}

export interface ExpoPushReceipt {
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: 'DeviceNotRegistered' | 'InvalidCredentials' | 'MessageTooBig' | 'MessageRateExceeded' | string;
  };
}

export interface PushSendResult {
  success: boolean;
  ticketId?: string;
  errorCode?: string;
  errorMessage?: string;
  isTokenInvalid: boolean;
}

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_API = 'https://exp.host/--/api/v2/push/getReceipts';

export class ExpoPushProviderAdapter {
  /**
   * Send a single push notification via Expo Push API.
   */
  async send(message: ExpoPushMessage): Promise<PushSendResult> {
    try {
      const response = await fetch(EXPO_PUSH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        return {
          success: false,
          errorCode: `HTTP_${response.status}`,
          errorMessage: `Expo Push API returned ${response.status}`,
          isTokenInvalid: false,
        };
      }

      const body = await response.json() as { data: ExpoPushTicket };
      const ticket = body.data;

      if (ticket.status === 'error') {
        const isTokenInvalid = ticket.details?.error === 'DeviceNotRegistered';
        return {
          success: false,
          errorCode: ticket.details?.error || 'UNKNOWN',
          errorMessage: ticket.message || 'Push delivery failed',
          isTokenInvalid,
        };
      }

      return {
        success: true,
        ticketId: ticket.id,
        isTokenInvalid: false,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: message,
        isTokenInvalid: false,
      };
    }
  }

  /**
   * Send multiple push notifications in a single batch.
   * Expo supports up to 100 messages per batch.
   */
  async sendBatch(messages: ExpoPushMessage[]): Promise<PushSendResult[]> {
    if (messages.length === 0) return [];

    try {
      const response = await fetch(EXPO_PUSH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        return messages.map(() => ({
          success: false,
          errorCode: `HTTP_${response.status}`,
          errorMessage: `Expo Push API returned ${response.status}`,
          isTokenInvalid: false,
        }));
      }

      const body = await response.json() as { data: ExpoPushTicket[] };
      return body.data.map((ticket) => {
        if (ticket.status === 'error') {
          return {
            success: false,
            errorCode: ticket.details?.error || 'UNKNOWN',
            errorMessage: ticket.message || 'Push delivery failed',
            isTokenInvalid: ticket.details?.error === 'DeviceNotRegistered',
          };
        }
        return {
          success: true,
          ticketId: ticket.id,
          isTokenInvalid: false,
        };
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return messages.map(() => ({
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: message,
        isTokenInvalid: false,
      }));
    }
  }

  /**
   * Check receipts for previously sent push tickets.
   */
  async getReceipts(ticketIds: string[]): Promise<Record<string, ExpoPushReceipt>> {
    if (ticketIds.length === 0) return {};

    try {
      const response = await fetch(EXPO_RECEIPTS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ ids: ticketIds }),
      });

      if (!response.ok) return {};

      const body = await response.json() as { data: Record<string, ExpoPushReceipt> };
      return body.data;
    } catch {
      return {};
    }
  }
}
