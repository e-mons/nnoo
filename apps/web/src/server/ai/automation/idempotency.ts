/**
 * Deterministic Idempotency Key Generator for Intelligence Automations
 */

import type { AutomationType } from '@nnoo/contracts';

export function buildScheduledIdempotencyKey(
  businessId: string,
  automationType: AutomationType,
  period: string,
  configVersion: number
): string {
  return `scheduled:${businessId}:${automationType}:${period}:v${configVersion}`;
}

export function buildManualIdempotencyKey(
  businessId: string,
  automationType: AutomationType,
  customKey?: string
): string {
  const token = customKey || new Date().toISOString().slice(0, 19);
  return `manual:${businessId}:${automationType}:${token}`;
}
