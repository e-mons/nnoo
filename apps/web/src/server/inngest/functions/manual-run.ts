import 'server-only';
import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { AutomationService } from '@/server/ai';

export const manualRunFunction = inngest.createFunction(
  {
    id: 'manual-automation-run',
    name: 'Manual Automation Run',
    concurrency: [{ key: 'event.data.businessId', limit: 1 }],
    retries: 1,
    triggers: [{ event: 'nnoo/automation.run-now' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    return await step.run('execute-manual-run', async () => {
      const supabase = await createClient();
      return await AutomationService.runNow(
        supabase,
        event.data.businessId,
        event.data.userId,
        event.data.userRole,
        event.data.automationType,
        event.data.customKey
      );
    });
  }
);
