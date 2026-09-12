import 'server-only';
import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { AutomationService } from '@/server/ai';

export const scheduledAttentionFunction = inngest.createFunction(
  {
    id: 'scheduled-attention-scan',
    name: 'Scheduled Attention Scan',
    concurrency: [{ key: 'event.data.businessId', limit: 1 }],
    retries: 2,
    triggers: [{ event: 'nnoo/automation.scheduled' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    if (event.data?.automationType !== 'attention_scan') {
      return { skipped: true, reason: 'AUTOMATION_TYPE_MISMATCH' };
    }

    return await step.run('scan-scheduled-attention', async () => {
      const supabase = await createClient();
      return await AutomationService.executeAttentionScan(
        supabase,
        event.data.businessId,
        event.data.scheduledPeriod,
        event.data.configVersion
      );
    });
  }
);
