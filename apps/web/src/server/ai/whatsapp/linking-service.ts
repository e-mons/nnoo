import 'server-only';
import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateWhatsAppLinkResult,
  WhatsAppConnectionSummary,
  DisconnectWhatsAppResult,
} from '@nnoo/contracts';
import { WhatsAppProviderAdapter } from './adapter';
import { getWhatsAppConfig } from './config';
import { AISafeError } from '../service';

export class WhatsAppLinkingService {
  /**
   * Generates a secure, short-lived (10 min), single-use link request code for the user.
   */
  public static async createLinkRequest(
    supabase: SupabaseClient,
    businessId: string,
    userId: string
  ): Promise<CreateWhatsAppLinkResult> {
    // Generate random 6-character alphanumeric code
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    const codeDisplay = `NNOO-${randomHex}`;
    const tokenHash = crypto.createHash('sha256').update(codeDisplay).digest('hex');

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes TTL

    // Invalidate any previous unconsumed link requests for this user/business
    await supabase
      .from('whatsapp_link_requests')
      .update({ consumed_at: new Date().toISOString() })
      .eq('business_id', businessId)
      .eq('user_id', userId)
      .is('consumed_at', null);

    const { error } = await supabase.from('whatsapp_link_requests').insert({
      business_id: businessId,
      user_id: userId,
      token_hash: tokenHash,
      code_display: codeDisplay,
      expires_at: expiresAt,
      max_attempts: 5,
      attempts: 0,
      consumed_at: null,
    });


    if (error) {
      throw new AISafeError('AI_INTERNAL_ERROR', `Failed to create WhatsApp link request: ${error.message}`, false);
    }

    const config = getWhatsAppConfig();
    const cleanPhone = WhatsAppProviderAdapter.normalizePhoneNumber(config.phoneNumberId);
    const clickToChatUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`CONNECT ${codeDisplay}`)}`;

    return {
      code: codeDisplay,
      expiresAt,
      qrPayload: clickToChatUrl,
      clickToChatUrl,
    };
  }

  /**
   * Retrieves connection state and available businesses for the user.
   */
  public static async getConnectionSummary(
    supabase: SupabaseClient,
    businessId: string,
    userId: string
  ): Promise<WhatsAppConnectionSummary> {
    // 1. Fetch connection for this business
    const { data: conn } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('business_id', businessId)
      .eq('user_id', userId)
      .maybeSingle();

    // 2. Fetch business name
    const { data: biz } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .maybeSingle();

    // 3. Fetch all active memberships for this user
    const { data: memberships } = await supabase
      .from('business_memberships')
      .select('business_id, role, businesses!inner(id, name, slug)')
      .eq('user_id', userId)
      .eq('membership_status', 'active');

    // 4. Fetch all user's connections across businesses to see which is active context
    const { data: allConns } = await supabase
      .from('whatsapp_connections')
      .select('business_id, active_business_context, status')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE');

    const activeMap = new Map((allConns || []).map((c) => [c.business_id, c.active_business_context]));

    const availableBusinesses = (memberships || []).map((m: any) => ({
      id: m.businesses.id,
      name: m.businesses.name,
      slug: m.businesses.slug,
      role: m.role,
      isActive: activeMap.get(m.businesses.id) ?? (m.businesses.id === businessId),
    }));

    const isConnected = conn?.status === 'ACTIVE';

    return {
      isConnected,
      status: (conn?.status as any) || 'PENDING',
      maskedPhone: conn?.masked_phone || null,
      activeBusinessId: businessId,
      activeBusinessName: biz?.name || 'My Business',
      linkedAt: conn?.linked_at || null,
      availableBusinesses,
    };
  }

  /**
   * Verifies the link code received via WhatsApp webhook and binds the phone number to the user and business.
   */
  public static async verifyAndLink(
    supabase: SupabaseClient,
    rawSenderPhone: string,
    codeText: string
  ): Promise<{ success: boolean; message: string; connectionId?: string; businessName?: string }> {
    // Normalize code text
    const cleanCode = codeText
      .trim()
      .toUpperCase()
      .replace(/^CONNECT\s+/, '')
      .trim();

    const tokenHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

    // Query active unconsumed link request
    const { data: request, error: reqError } = await supabase
      .from('whatsapp_link_requests')
      .select('id, business_id, user_id, attempts, max_attempts, expires_at, consumed_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (reqError || !request) {
      return {
        success: false,
        message: '❌ Invalid link code. Please generate a new code from NNOO Settings -> WhatsApp.',
      };
    }

    if (request.consumed_at) {
      return {
        success: false,
        message: '⚠️ This link code has already been used. Please generate a new code in NNOO.',
      };
    }

    if (new Date(request.expires_at).getTime() < Date.now()) {
      return {
        success: false,
        message: '⏳ This link code has expired. Codes are valid for 10 minutes. Please generate a new code.',
      };
    }

    if (request.attempts >= request.max_attempts) {
      return {
        success: false,
        message: '🔒 Maximum linking attempts exceeded. Please generate a new code in NNOO.',
      };
    }

    // Verify current membership status
    const { data: membership } = await supabase
      .from('business_memberships')
      .select('role, membership_status, businesses!inner(id, name)')
      .eq('business_id', request.business_id)
      .eq('user_id', request.user_id)
      .eq('membership_status', 'active')
      .maybeSingle();

    if (!membership) {
      return {
        success: false,
        message: '🚫 Active business membership required. Contact your business administrator.',
      };
    }

    const config = getWhatsAppConfig();
    const normalizedPhone = WhatsAppProviderAdapter.normalizePhoneNumber(rawSenderPhone);
    const maskedPhone = WhatsAppProviderAdapter.maskPhoneNumber(rawSenderPhone);
    const phoneLookupKey = WhatsAppProviderAdapter.computePhoneLookupKey(normalizedPhone, config.pepper);

    // Set other business connections for this user to active_business_context: false
    await supabase
      .from('whatsapp_connections')
      .update({ active_business_context: false, updated_at: new Date().toISOString() })
      .eq('user_id', request.user_id);

    // Upsert whatsapp_connections for this business and user
    const { data: connection, error: connError } = await supabase
      .from('whatsapp_connections')
      .upsert(
        {
          business_id: request.business_id,
          user_id: request.user_id,
          provider: 'meta_cloud_api',
          provider_phone_number_id: config.phoneNumberId || 'meta_phone_id',
          phone_lookup_key: phoneLookupKey,
          masked_phone: maskedPhone,
          status: 'ACTIVE',
          consent_status: 'CONSENTED',
          consent_version: 'v1',
          consented_at: new Date().toISOString(),
          opted_out_at: null,
          linked_at: new Date().toISOString(),
          revoked_at: null,
          active_business_context: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'business_id,user_id' }
      )
      .select('id')
      .single();

    if (connError) {
      return {
        success: false,
        message: `Failed to complete WhatsApp connection: ${connError.message}`,
      };
    }

    // Mark link request consumed
    await supabase
      .from('whatsapp_link_requests')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', request.id);

    let businessName = (membership as any).businesses?.name;
    if (!businessName) {
      const { data: b } = await supabase.from('businesses').select('name').eq('id', request.business_id).maybeSingle();
      businessName = b?.name || 'your business';
    }

    return {
      success: true,
      message: `✅ *NNOO Connected Successfully!*\n\nYour WhatsApp is now linked to *${businessName}*.\n\n• Ask questions anytime (e.g. "What were our sales today?")\n• Type *HELP* for command shortcuts\n• Type *BUSINESS* to switch businesses\n• Type *STOP* to pause notifications`,
      connectionId: connection?.id || 'conn-id',
      businessName,
    };
  }

  /**
   * Disconnects WhatsApp integration for a specific business.
   */
  public static async disconnect(
    supabase: SupabaseClient,
    businessId: string,
    userId: string
  ): Promise<DisconnectWhatsAppResult> {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('whatsapp_connections')
      .update({
        status: 'REVOKED',
        consent_status: 'REVOKED',
        revoked_at: now,
        active_business_context: false,
        updated_at: now,
      })
      .eq('business_id', businessId)
      .eq('user_id', userId);

    if (error) {
      throw new AISafeError('AI_INTERNAL_ERROR', `Failed to disconnect WhatsApp: ${error.message}`, false);
    }

    return {
      success: true,
      disconnectedAt: now,
    };
  }

  /**
   * Switches the active business context for WhatsApp interactions.
   */
  public static async switchActiveBusiness(
    supabase: SupabaseClient,
    userId: string,
    targetBusinessId: string
  ): Promise<{ success: boolean; businessName: string }> {
    // 1. Verify active membership in target business
    const { data: membership } = await supabase
      .from('business_memberships')
      .select('role, membership_status, businesses!inner(id, name)')
      .eq('business_id', targetBusinessId)
      .eq('user_id', userId)
      .eq('membership_status', 'active')
      .maybeSingle();

    if (!membership) {
      throw new AISafeError('ASK_NNOO_FORBIDDEN', 'You do not have an active membership in this business.', false);
    }


    const now = new Date().toISOString();

    // 2. Set all other connections for this user to active_business_context: false
    await supabase
      .from('whatsapp_connections')
      .update({ active_business_context: false, updated_at: now })
      .eq('user_id', userId);

    // 3. Set target business connection to active_business_context: true
    const { error } = await supabase
      .from('whatsapp_connections')
      .update({ active_business_context: true, status: 'ACTIVE', updated_at: now })
      .eq('business_id', targetBusinessId)
      .eq('user_id', userId);

    if (error) {
      throw new AISafeError('AI_INTERNAL_ERROR', `Failed to switch WhatsApp business: ${error.message}`, false);
    }

    let businessName = (membership as any).businesses?.name;
    if (!businessName) {
      const { data: b } = await supabase.from('businesses').select('name').eq('id', targetBusinessId).maybeSingle();
      businessName = b?.name || 'Selected Business';
    }

    return {
      success: true,
      businessName,
    };
  }
}

