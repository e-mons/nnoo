import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { WhatsAppLinkingService } from './linking-service';

export interface CommandRouteResult {
  isHandled: boolean;
  replyText?: string;
  commandType?: string;
  query?: string;
}

export class WhatsAppCommandRouter {
  /**
   * Evaluates inbound message text and executes deterministic command routing.
   * Guaranteed 0 Gemini API calls for all deterministic commands and mutation blocks.
   */
  public static async routeInboundMessage(
    supabase: SupabaseClient,
    userId: string,
    activeBusinessId: string,
    rawText: string
  ): Promise<CommandRouteResult> {
    const trimmed = rawText.trim();
    const normalized = trimmed.toUpperCase();

    // 1. HELP / MENU / COMMANDS
    if (['HELP', 'MENU', 'COMMANDS', 'INFO', '?'].includes(normalized)) {
      return {
        isHandled: true,
        commandType: 'HELP',
        replyText:
          `🤖 *NNOO WhatsApp Business Assistant*\n\n` +
          `You can ask real-time questions about your business:\n` +
          `• _"What were our sales today?"_\n` +
          `• _"Do we have any low stock items?"_\n` +
          `• _"List our overdue invoices"_\n` +
          `• _"How is the business performing this month?"_\n\n` +
          `*Commands:*\n` +
          `• *BUSINESS* — View & switch active business\n` +
          `• *STOP* — Pause WhatsApp notifications\n` +
          `• *START* — Resume WhatsApp notifications\n` +
          `• *HELP* — Show this menu\n\n` +
          `🔒 _WhatsApp provides verified, read-only insights. Financial entries must be made inside the NNOO app._`,
      };
    }

    // 2. STOP / OPT OUT
    if (['STOP', 'UNSUBSCRIBE', 'CANCEL', 'OFF', 'PAUSE'].includes(normalized)) {
      const now = new Date().toISOString();
      await supabase
        .from('whatsapp_connections')
        .update({
          consent_status: 'OPTED_OUT',
          opted_out_at: now,
          updated_at: now,
        })
        .eq('user_id', userId);

      return {
        isHandled: true,
        commandType: 'STOP',
        replyText:
          `🛑 *NNOO Notifications Paused*\n\n` +
          `You will no longer receive WhatsApp alerts from NNOO.\n\n` +
          `To resume receiving alerts at any time, simply reply with *START*.\n` +
          `_Your in-app notifications in NNOO remain active._`,
      };
    }

    // 3. START / RESUME
    if (['START', 'RESUME', 'UNSTOP', 'ON'].includes(normalized)) {
      const now = new Date().toISOString();
      await supabase
        .from('whatsapp_connections')
        .update({
          consent_status: 'CONSENTED',
          opted_out_at: null,
          updated_at: now,
        })
        .eq('user_id', userId)
        .eq('status', 'ACTIVE');

      return {
        isHandled: true,
        commandType: 'START',
        replyText:
          `✅ *NNOO Notifications Resumed*\n\n` +
          `You will now receive your configured WhatsApp business alerts.\n\n` +
          `Ask any question or type *HELP* for more commands.`,
      };
    }

    // 4. BUSINESS (List businesses)
    if (['BUSINESS', 'BUSINESSES', 'SWITCH'].includes(normalized)) {
      const { data: memberships } = await supabase
        .from('business_memberships')
        .select('business_id, role, businesses!inner(id, name, slug)')
        .eq('user_id', userId)
        .eq('membership_status', 'active');

      if (!memberships || memberships.length === 0) {
        return {
          isHandled: true,
          commandType: 'BUSINESS',
          replyText: `⚠️ No active business memberships found for your account.`,
        };
      }

      const lines = await Promise.all(
        memberships.map(async (m: any, idx: number) => {
          let name = m.businesses?.name;
          if (!name) {
            const { data: b } = await supabase.from('businesses').select('name').eq('id', m.business_id).maybeSingle();
            name = b?.name || 'Business';
          }
          const isActive = m.business_id === activeBusinessId;
          const tag = isActive ? ' *(Active)*' : '';
          return `${idx + 1}. *${name}* [${m.role}]${tag}`;
        })
      );

      return {
        isHandled: true,
        commandType: 'BUSINESS',
        replyText:
          `🏢 *Your NNOO Businesses:*\n\n` +
          lines.join('\n') +
          `\n\nTo switch active business, reply with *BUSINESS <number>* (e.g. *BUSINESS 2*).`,
      };
    }

    // 5. BUSINESS <number> / SWITCH <number>
    const switchMatch = normalized.match(/^(?:BUSINESS|SWITCH)\s+(\d+)$/);
    if (switchMatch) {
      const targetIndex = parseInt(switchMatch[1], 10) - 1;

      const { data: memberships } = await supabase
        .from('business_memberships')
        .select('business_id, role, businesses!inner(id, name)')
        .eq('user_id', userId)
        .eq('membership_status', 'active');


      if (!memberships || targetIndex < 0 || targetIndex >= memberships.length) {
        return {
          isHandled: true,
          commandType: 'SWITCH_BUSINESS',
          replyText: `❌ Invalid business number. Type *BUSINESS* to see available businesses.`,
        };
      }

      const targetBiz = memberships[targetIndex];
      const result = await WhatsAppLinkingService.switchActiveBusiness(supabase, userId, targetBiz.business_id);

      return {
        isHandled: true,
        commandType: 'SWITCH_BUSINESS',
        replyText: `🔄 *Switched Active Business*\n\nActive context set to *${result.businessName}*.\nAll subsequent questions will reference this business.`,
      };
    }

    // 6. Security guard: Block financial mutation attempts
    if (WhatsAppCommandRouter.isMutationAttempt(normalized)) {
      return {
        isHandled: true,
        commandType: 'MUTATION_BLOCKED',
        replyText:
          `🚫 *Action Not Permitted via WhatsApp*\n\n` +
          `For security, audit compliance, and accounting integrity, financial records (sales, expenses, payments, refunds, stock changes, invoices) must be recorded directly in the NNOO web or mobile app.\n\n` +
          `_WhatsApp is strictly read-only for verified queries and alerts._`,
      };
    }

    // Not a deterministic command — route to Ask NNOO
    return {
      isHandled: false,
      query: trimmed,
    };
  }

  /**
   * Fast regex check for intent to perform financial mutations.
   */
  private static isMutationAttempt(textUpper: string): boolean {
    const mutationPatterns = [
      /^(?:RECORD|ADD|CREATE|ENTER|LOG|POST|MAKE)\s+(?:A\s+)?(?:SALE|EXPENSE|PAYMENT|REFUND|INVOICE|RECEIPT|BILL|STOCK|ADJUSTMENT)/,
      /^(?:PAY|REFUND|CREDIT|DEBIT)\s+/,
      /^(?:DELETE|VOID|REMOVE|CANCEL)\s+(?:SALE|EXPENSE|INVOICE|PAYMENT)/,
      /^(?:GENERATE|CREATE)\s+(?:CREDIT PASSPORT|PASSPORT)/,
      /^(?:POST|CONFIRM|APPROVE)\s+(?:BOOKKEEPER|CLASSIFICATION|ENTRY)/,
    ];

    return mutationPatterns.some((pattern) => pattern.test(textUpper));
  }
}
