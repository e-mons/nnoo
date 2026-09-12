import 'server-only';
import { Inngest } from 'inngest';

export type AutomationTriggerEvent = {
  name: 'nnoo/automation.scheduled';
  data: {
    businessId: string;
    automationType: 'business_summary' | 'health_score_refresh' | 'attention_scan';
    scheduledPeriod?: string;
    configVersion?: number;
  };
};

export type ManualRunTriggerEvent = {
  name: 'nnoo/automation.run-now';
  data: {
    businessId: string;
    userId: string;
    userRole: string;
    automationType: 'business_summary' | 'health_score_refresh' | 'attention_scan';
    customKey?: string;
  };
};

export type Events = {
  'nnoo/automation.scheduled': AutomationTriggerEvent;
  'nnoo/automation.run-now': ManualRunTriggerEvent;
};

export const inngest = new Inngest({
  id: 'nnoo-business-os',
});
