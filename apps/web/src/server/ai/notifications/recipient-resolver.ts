import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@nnoo/supabase/database.types';
import { hasPermission, FeatureModule } from '@/lib/auth/rbac-client';
import { NotificationPolicy } from './policy-registry';

export interface EligibleRecipient {
  userId: string;
  role: string;
}

export class RecipientResolverService {
  /**
   * Resolves all active business members eligible to receive a notification
   * based on current RBAC capabilities and personal notification preferences.
   */
  static async resolveRecipients(
    supabase: SupabaseClient<Database>,
    businessId: string,
    policy: NotificationPolicy
  ): Promise<EligibleRecipient[]> {
    // 1. Fetch active memberships
    const { data: memberships, error: memberError } = await supabase
      .from('business_memberships')
      .select('user_id, role, membership_status')
      .eq('business_id', businessId)
      .eq('membership_status', 'active');

    if (memberError || !memberships || memberships.length === 0) {
      return [];
    }

    // 2. Filter by required capabilities
    const capabilityPermittedMembers = memberships.filter((m) => {
      // Must satisfy all required capabilities
      return policy.requiredCapabilities.every((cap: FeatureModule) =>
        hasPermission(m.role, cap)
      );
    });

    if (capabilityPermittedMembers.length === 0) {
      return [];
    }

    const candidateUserIds = capabilityPermittedMembers.map((m) => m.user_id);

    // 3. Fetch user preference overrides for this category and IN_APP channel
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('user_id, enabled')
      .eq('business_id', businessId)
      .eq('category', policy.category)
      .eq('channel', 'IN_APP')
      .in('user_id', candidateUserIds);

    const preferenceMap = new Map<string, boolean>();
    if (preferences) {
      for (const pref of preferences) {
        preferenceMap.set(pref.user_id, pref.enabled);
      }
    }

    // 4. Return eligible members where preference is enabled (or defaults to policy.defaultEnabled)
    const eligible: EligibleRecipient[] = [];
    for (const member of capabilityPermittedMembers) {
      const isEnabled = preferenceMap.has(member.user_id)
        ? preferenceMap.get(member.user_id)!
        : policy.defaultEnabled;

      if (isEnabled) {
        eligible.push({
          userId: member.user_id,
          role: member.role,
        });
      }
    }

    return eligible;
  }
}
