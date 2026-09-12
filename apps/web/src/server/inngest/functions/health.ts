import 'server-only';
import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { AutomationService } from '@/server/ai';

export const scheduledHealthFunction = inngest.createFunction(
  {
    id: 'scheduled-health-refresh',
    name: 'Scheduled Health Score Refresh',
    concurrency: [{ key: 'event.data.businessId', limit: 1 }],
    retries: 2,
    triggers: [{ event: 'nnoo/automation.scheduled' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    if (event.data?.automationType !== 'health_score_refresh') {
      return { skipped: true, reason: 'AUTOMATION_TYPE_MISMATCH' };
    }

    return await step.run('refresh-scheduled-health', async () => {
      const supabase = await createClient();
      return await AutomationService.executeScheduledHealth(
        supabase,
        event.data.businessId,
        event.data.scheduledPeriod,
        event.data.configVersion
      );
    });
  }
);
