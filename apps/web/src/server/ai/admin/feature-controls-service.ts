import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PlatformFeatureControl,
  UpdatePlatformFeatureControlInput,
} from '@nnoo/contracts/ai';
import { AISafeError } from '../service';
import { requirePlatformAdmin } from './auth';

export class PlatformFeatureControlsService {
  /**
   * Retrieves all platform feature controls.
   */
  public static async getControls(
    supabase: SupabaseClient
  ): Promise<PlatformFeatureControl[]> {
    const { data, error } = await supabase
      .from('platform_feature_controls')
      .select('*')
      .order('feature_key', { ascending: true });

    if (error) {
      throw new AISafeError(
        'ADMIN_INTERNAL_ERROR' as any,
        `Failed to retrieve platform feature controls: ${error.message}`,
        false
      );
    }

    return (data || []).map((row) => ({
      id: row.id,
      featureKey: row.feature_key,
      enabled: row.enabled,
      description: row.description,
      updatedByAdminId: row.updated_by_admin_id,
      updatedReason: row.updated_reason,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Checks if a specific platform feature is currently enabled.
   */
  public static async isFeatureEnabled(
    supabase: SupabaseClient,
    featureKey: string
  ): Promise<boolean> {
    const { data } = await supabase
      .from('platform_feature_controls')
      .select('enabled')
      .eq('feature_key', featureKey)
      .maybeSingle();

    // Default to true if not found in table to maintain standard operations
    return data?.enabled ?? true;
  }

  /**
   * Updates an operational feature control (e.g. kill switch).
   * Strictly requires active Platform Admin and logs an audit record with mandatory reason.
   */
  public static async updateControl(
    supabase: SupabaseClient,
    input: UpdatePlatformFeatureControlInput
  ): Promise<PlatformFeatureControl> {
    const { user, adminRecord } = await requirePlatformAdmin(supabase);

    if (adminRecord.role === 'support') {
      throw new AISafeError(
        'ADMIN_FORBIDDEN' as any,
        'Support role is not permitted to mutate platform feature controls.',
        false
      );
    }

    if (!input.reason || input.reason.trim().length < 3) {
      throw new AISafeError(
        'ADMIN_REASON_REQUIRED' as any,
        'A valid reason (at least 3 characters) is required to change platform operational controls.',
        false
      );
    }

    // 1. Fetch current control state
    const { data: existing, error: fetchErr } = await supabase
      .from('platform_feature_controls')
      .select('*')
      .eq('feature_key', input.featureKey)
      .maybeSingle();

    if (fetchErr || !existing) {
      throw new AISafeError(
        'ADMIN_FEATURE_CONTROL_INVALID' as any,
        `Feature control key '${input.featureKey}' does not exist.`,
        false
      );
    }

    const previousState = existing.enabled;
    const now = new Date().toISOString();

    // 2. Update control state
    const { data: updated, error: updateErr } = await supabase
      .from('platform_feature_controls')
      .update({
        enabled: input.enabled,
        updated_by_admin_id: adminRecord.id,
        updated_reason: input.reason.trim(),
        updated_at: now,
      })
      .eq('feature_key', input.featureKey)
      .select('*')
      .single();

    if (updateErr || !updated) {
      throw new AISafeError(
        'ADMIN_INTERNAL_ERROR' as any,
        `Failed to update platform feature control: ${updateErr?.message}`,
        false
      );
    }

    // 3. Log audit event
    await supabase.from('platform_audit_events').insert({
      actor_id: adminRecord.id,
      action: input.enabled ? 'platform.feature.enable' : 'platform.feature.disable',
      target_type: 'platform_feature_control',
      target_id: updated.id,
      reason: input.reason.trim(),
      metadata: {
        featureKey: input.featureKey,
        previousState,
        newState: input.enabled,
        adminUserId: user.id,
        adminEmail: user.email,
      },
      created_at: now,
    });

    return {
      id: updated.id,
      featureKey: updated.feature_key,
      enabled: updated.enabled,
      description: updated.description,
      updatedByAdminId: updated.updated_by_admin_id,
      updatedReason: updated.updated_reason,
      updatedAt: updated.updated_at,
    };
  }
}
