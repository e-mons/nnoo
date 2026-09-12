import { scheduledSummaryFunction } from './summary';
import { scheduledHealthFunction } from './health';
import { scheduledAttentionFunction } from './attention';
import { manualRunFunction } from './manual-run';

export const inngestFunctions = [
  scheduledSummaryFunction,
  scheduledHealthFunction,
  scheduledAttentionFunction,
  manualRunFunction,
];
