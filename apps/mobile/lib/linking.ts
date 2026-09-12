/**
 * Deep-link configuration for NNOO mobile app.
 *
 * Maps notification action keys to safe mobile screens.
 * Push is not authorization — destination screens must re-check
 * auth and business membership on mount.
 */

import { MOBILE_ACTION_ROUTE_MAP, type MobileActionKey } from '@nnoo/contracts';

/**
 * Resolve a notification action key to a valid Expo Router path.
 * Returns null if the action key is not in the allowlist.
 */
export function resolveActionRoute(actionKey: string): string | null {
  const route = MOBILE_ACTION_ROUTE_MAP[actionKey as MobileActionKey];
  return route || null;
}

/**
 * Check if a deep-link path is in the allowlist.
 */
export function isAllowedDeepLink(path: string): boolean {
  const allowedPaths = Object.values(MOBILE_ACTION_ROUTE_MAP);
  return allowedPaths.some((allowed) => path.startsWith(allowed));
}

/**
 * NNOO deep-link URL scheme prefix.
 */
export const NNOO_SCHEME = 'nnoo';
