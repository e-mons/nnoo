import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { MobilePushDevice, RegisterPushDeviceInput } from '@nnoo/contracts';

/**
 * PushDeviceService — Manages push device token registration,
 * rollover, status updates, and sign-out revocation.
 *
 * All operations are user-scoped via RLS (auth.uid() = user_id).
 */
export class PushDeviceService {
  /**
   * Register or update a push device token.
   * Uses upsert on (user_id, installation_id) to handle token rollover.
   */
  static async registerDevice(
    supabase: SupabaseClient,
    userId: string,
    input: RegisterPushDeviceInput
  ): Promise<MobilePushDevice> {
    const { data, error } = await supabase
      .from('mobile_push_devices')
      .upsert(
        {
          user_id: userId,
          installation_id: input.installationId,
          push_token: input.pushToken,
          platform: input.platform,
          provider: input.provider || 'EXPO',
          app_version: input.appVersion || null,
          permission_state: input.permissionState || 'GRANTED',
          status: 'ACTIVE',
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          revoked_at: null,
        },
        { onConflict: 'user_id,installation_id' }
      )
      .select('*')
      .single();

    if (error) throw new Error(`Failed to register push device: ${error.message}`);

    return mapDeviceRow(data);
  }

  /**
   * Revoke a push device by installation ID (e.g., on sign-out).
   */
  static async revokeDevice(
    supabase: SupabaseClient,
    userId: string,
    installationId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('mobile_push_devices')
      .update({
        status: 'REVOKED',
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('installation_id', installationId);

    if (error) throw new Error(`Failed to revoke push device: ${error.message}`);
  }

  /**
   * Revoke all active devices for a user (e.g., on password change / security event).
   */
  static async revokeAllDevices(
    supabase: SupabaseClient,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('mobile_push_devices')
      .update({
        status: 'REVOKED',
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'ACTIVE');

    if (error) throw new Error(`Failed to revoke all push devices: ${error.message}`);
  }

  /**
   * List active devices for the authenticated user.
   */
  static async listActiveDevices(
    supabase: SupabaseClient,
    userId: string
  ): Promise<MobilePushDevice[]> {
    const { data, error } = await supabase
      .from('mobile_push_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .order('last_seen_at', { ascending: false });

    if (error) throw new Error(`Failed to list push devices: ${error.message}`);

    return (data || []).map(mapDeviceRow);
  }

  /**
   * Get active push tokens for a user across all devices.
   * Used by delivery-service for fan-out.
   */
  static async getActiveTokens(
    supabase: SupabaseClient,
    userId: string
  ): Promise<Array<{ id: string; pushToken: string; platform: string }>> {
    const { data, error } = await supabase
      .from('mobile_push_devices')
      .select('id, push_token, platform')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .eq('permission_state', 'GRANTED');

    if (error) throw new Error(`Failed to get active push tokens: ${error.message}`);

    return (data || []).map((d) => ({
      id: d.id,
      pushToken: d.push_token,
      platform: d.platform,
    }));
  }

  /**
   * Mark a device as expired (invalid token detected by Expo Push API).
   */
  static async markDeviceExpired(
    supabase: SupabaseClient,
    deviceId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('mobile_push_devices')
      .update({
        status: 'EXPIRED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', deviceId);

    if (error) throw new Error(`Failed to mark device expired: ${error.message}`);
  }

  /**
   * Touch last_seen_at for a device (called on app foreground).
   */
  static async touchDevice(
    supabase: SupabaseClient,
    userId: string,
    installationId: string
  ): Promise<void> {
    await supabase
      .from('mobile_push_devices')
      .update({
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('installation_id', installationId)
      .eq('status', 'ACTIVE');
  }
}

// ─── Row → Contract mapper ────────────────────────────────────────
function mapDeviceRow(row: Record<string, unknown>): MobilePushDevice {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    installationId: row.installation_id as string,
    provider: row.provider as MobilePushDevice['provider'],
    pushToken: row.push_token as string,
    platform: row.platform as MobilePushDevice['platform'],
    appVersion: (row.app_version as string) || null,
    environment: row.environment as string,
    status: row.status as MobilePushDevice['status'],
    permissionState: row.permission_state as MobilePushDevice['permissionState'],
    lastSeenAt: row.last_seen_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    revokedAt: (row.revoked_at as string) || null,
  };
}
