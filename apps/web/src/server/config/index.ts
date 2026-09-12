import 'server-only';
import {
  validateServerConfig,
  type ServerConfig,
  type NnooEnvironment,
  getPlatformProviderStatus,
  type PlatformProviderStatus,
  assertPaystackEnvironment,
  assertMobileBackendMatches,
} from '@nnoo/config';

let cachedServerConfig: ServerConfig | null = null;

/**
 * Retrieves the validated Server Configuration.
 * Caches in memory for the lifecycle of the server process.
 */
export function getServerConfig(): ServerConfig {
  if (!cachedServerConfig) {
    cachedServerConfig = validateServerConfig(process.env);
  }
  return cachedServerConfig;
}

/**
 * Resets cached server config (used for testing environment changes).
 */
export function resetCachedServerConfig(): void {
  cachedServerConfig = null;
}

/**
 * Returns safe provider readiness without leaking raw credentials.
 */
export function getRuntimeProviderStatus(): PlatformProviderStatus {
  const config = getServerConfig();
  return getPlatformProviderStatus(config);
}

export {
  validateServerConfig,
  type ServerConfig,
  type NnooEnvironment,
  getPlatformProviderStatus,
  type PlatformProviderStatus,
  assertPaystackEnvironment,
  assertMobileBackendMatches,
};
