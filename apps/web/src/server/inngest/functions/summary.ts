import 'server-only';
import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { AutomationService } from '@/server/ai';

export const scheduledSummaryFunction = inngest.createFunction(
  {
    id: 'scheduled-business-summary',
    name: 'Scheduled Business Summary',
    concurrency: [{ key: 'event.data.businessId', limit: 1 }],
    retries: 2,
    triggers: [{ event: 'nnoo/automation.scheduled' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    if (event.data?.automationType !== 'business_summary') {
      return { skipped: true, reason: 'AUTOMATION_TYPE_MISMATCH' };
    }

    return await step.run('generate-scheduled-summary', async () => {
      const supabase = await createClient();
      return await AutomationService.executeScheduledSummary(
        supabase,
        event.data.businessId,
        event.data.scheduledPeriod,
        event.data.configVersion
      );
    });
  }
);
