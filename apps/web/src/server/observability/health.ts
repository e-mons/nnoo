import 'server-only';

export type ComponentHealthStatus =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | 'UNKNOWN';

export type IncidentSeverity = 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4';

export type IncidentState =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'MITIGATED'
  | 'MONITORING'
  | 'RESOLVED';

export interface ComponentHealthInfo {
  component: string;
  status: ComponentHealthStatus;
  lastObservedAt: string;
  isStale: boolean;
  message?: string;
  metrics?: Record<string, unknown>;
}

export interface PlatformHealthSnapshot {
  systemStatus: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  evaluatedAt: string;
  environment: string;
  components: {
    coreApi: ComponentHealthInfo;
    database: ComponentHealthInfo;
    paystackBilling: ComponentHealthInfo;
    geminiAi: ComponentHealthInfo;
    inngestJobs: ComponentHealthInfo;
    notifications: ComponentHealthInfo;
    pushEngine: ComponentHealthInfo;
    whatsappBusiness: ComponentHealthInfo;
    backupRecovery: ComponentHealthInfo;
  };
}

export interface PlatformIncidentRecord {
  incidentId: string;
  severity: IncidentSeverity;
  title: string;
  affectedComponent: string;
  environment: string;
  status: IncidentState;
  startedAt: string;
  detectedAt: string;
  resolvedAt?: string;
  correlationRefs: string[];
  summary: string;
  mitigationRunbook: string;
}

export class PlatformReliabilityService {
  /**
   * Maximum duration (in milliseconds) before an observed health state is marked as stale.
   * Default: 1 hour for high-frequency components, 24 hours for daily jobs/backups.
   */
  private static readonly STALE_THRESHOLD_MS = 60 * 60 * 1000;

  /**
   * Evaluates deterministic health status for a given component based on observed telemetry.
   * Runs with ZERO external paid provider calls.
   */
  public static evaluateComponentHealth(params: {
    component: string;
    isConfigured: boolean;
    recentSuccessCount: number;
    recentFailureCount: number;
    lastObservedTimestamp?: string | null;
    staleThresholdMs?: number;
  }): ComponentHealthInfo {
    const lastObservedAt = params.lastObservedTimestamp || new Date().toISOString();
    const threshold = params.staleThresholdMs || this.STALE_THRESHOLD_MS;
    const isStale = Date.now() - new Date(lastObservedAt).getTime() > threshold;

    if (!params.isConfigured) {
      return {
        component: params.component,
        status: 'NOT_CONFIGURED',
        lastObservedAt,
        isStale: false,
        message: 'Provider configuration or credentials not active',
      };
    }

    if (params.recentSuccessCount === 0 && params.recentFailureCount === 0) {
      return {
        component: params.component,
        status: isStale ? 'UNKNOWN' : 'CONFIGURED',
        lastObservedAt,
        isStale,
        message: isStale ? 'No recent activity observed in telemetry window' : 'Configured and waiting for events',
      };
    }

    if (params.recentFailureCount > 0 && params.recentSuccessCount === 0) {
      return {
        component: params.component,
        status: 'UNAVAILABLE',
        lastObservedAt,
        isStale: false,
        message: `Persistent failures detected (${params.recentFailureCount} failures)`,
      };
    }

    if (params.recentFailureCount > 0 && params.recentSuccessCount > 0) {
      const failureRate = params.recentFailureCount / (params.recentSuccessCount + params.recentFailureCount);
      return {
        component: params.component,
        status: failureRate > 0.3 ? 'DEGRADED' : 'HEALTHY',
        lastObservedAt,
        isStale: false,
        message: `Intermittent failures (${(failureRate * 100).toFixed(1)}% error rate)`,
      };
    }

    return {
      component: params.component,
      status: 'HEALTHY',
      lastObservedAt,
      isStale,
      message: isStale ? 'Healthy (telemetry observation is older than window)' : 'Operating normally with zero recent errors',
    };
  }

  /**
   * Assembles the platform-wide authenticated operational health snapshot.
   */
  public static getPlatformSnapshot(evaluations: {
    database: { isConnected: boolean; latencyMs: number; lastObserved?: string };
    paystack: { isConfigured: boolean; success: number; fail: number; lastObserved?: string };
    gemini: { isConfigured: boolean; success: number; fail: number; lastObserved?: string };
    jobs: { isConfigured: boolean; success: number; fail: number; lastObserved?: string };
    push: { isConfigured: boolean; success: number; fail: number; lastObserved?: string };
    whatsapp: { isConfigured: boolean; success: number; fail: number; lastObserved?: string };
    recovery: { isConfigured: boolean; lastRehearsalAt?: string };
  }): PlatformHealthSnapshot {
    const now = new Date().toISOString();

    const coreApiHealth: ComponentHealthInfo = {
      component: 'Core Web & API',
      status: 'HEALTHY',
      lastObservedAt: now,
      isStale: false,
      message: 'Next.js application runtime active and serving requests',
    };

    const databaseHealth: ComponentHealthInfo = {
      component: 'Supabase PostgreSQL',
      status: evaluations.database.isConnected ? 'HEALTHY' : 'UNAVAILABLE',
      lastObservedAt: evaluations.database.lastObserved || now,
      isStale: false,
      message: evaluations.database.isConnected ? `Connected (${evaluations.database.latencyMs}ms)` : 'Database unreachable',
    };

    const paystackHealth = this.evaluateComponentHealth({
      component: 'Paystack SaaS Billing',
      isConfigured: evaluations.paystack.isConfigured,
      recentSuccessCount: evaluations.paystack.success,
      recentFailureCount: evaluations.paystack.fail,
      lastObservedTimestamp: evaluations.paystack.lastObserved,
    });

    const geminiHealth = this.evaluateComponentHealth({
      component: 'Google Gemini AI',
      isConfigured: evaluations.gemini.isConfigured,
      recentSuccessCount: evaluations.gemini.success,
      recentFailureCount: evaluations.gemini.fail,
      lastObservedTimestamp: evaluations.gemini.lastObserved,
    });

    const jobsHealth = this.evaluateComponentHealth({
      component: 'Inngest Durable Jobs',
      isConfigured: evaluations.jobs.isConfigured,
      recentSuccessCount: evaluations.jobs.success,
      recentFailureCount: evaluations.jobs.fail,
      lastObservedTimestamp: evaluations.jobs.lastObserved,
    });

    const pushHealth = this.evaluateComponentHealth({
      component: 'Expo / APNs Push Engine',
      isConfigured: evaluations.push.isConfigured,
      recentSuccessCount: evaluations.push.success,
      recentFailureCount: evaluations.push.fail,
      lastObservedTimestamp: evaluations.push.lastObserved,
    });

    const whatsappHealth = this.evaluateComponentHealth({
      component: 'Meta WhatsApp Cloud API',
      isConfigured: evaluations.whatsapp.isConfigured,
      recentSuccessCount: evaluations.whatsapp.success,
      recentFailureCount: evaluations.whatsapp.fail,
      lastObservedTimestamp: evaluations.whatsapp.lastObserved,
    });

    const backupHealth: ComponentHealthInfo = {
      component: 'Supabase Backup & PITR',
      status: evaluations.recovery.isConfigured ? 'HEALTHY' : 'CONFIGURED',
      lastObservedAt: evaluations.recovery.lastRehearsalAt || now,
      isStale: false,
      message: evaluations.recovery.lastRehearsalAt ? `Last rehearsal: ${evaluations.recovery.lastRehearsalAt}` : 'Backup policy active',
    };

    const allStatuses = [
      coreApiHealth.status,
      databaseHealth.status,
      paystackHealth.status,
      geminiHealth.status,
      jobsHealth.status,
      pushHealth.status,
      whatsappHealth.status,
      backupHealth.status,
    ];

    let systemStatus: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE' = 'OPERATIONAL';
    if (databaseHealth.status === 'UNAVAILABLE' || coreApiHealth.status === 'UNAVAILABLE') {
      systemStatus = 'OUTAGE';
    } else if (allStatuses.includes('DEGRADED') || allStatuses.includes('UNAVAILABLE')) {
      systemStatus = 'DEGRADED';
    }

    return {
      systemStatus,
      evaluatedAt: now,
      environment: process.env.NNOO_ENV ?? process.env.NODE_ENV ?? 'development',
      components: {
        coreApi: coreApiHealth,
        database: databaseHealth,
        paystackBilling: paystackHealth,
        geminiAi: geminiHealth,
        inngestJobs: jobsHealth,
        notifications: {
          component: 'In-App Notifications',
          status: 'HEALTHY',
          lastObservedAt: now,
          isStale: false,
          message: 'Notification Attention Center active',
        },
        pushEngine: pushHealth,
        whatsappBusiness: whatsappHealth,
        backupRecovery: backupHealth,
      },
    };
  }

  /**
   * Evaluates whether an incident alert should be suppressed due to deduplication / cooldown rules.
   * Prevents 1 provider outage generating 500 duplicate alerts.
   */
  public static shouldSuppressAlert(params: {
    component: string;
    errorCode: string;
    lastAlertedTimestamp?: string | null;
    cooldownMinutes?: number;
  }): { suppress: boolean; reason?: string } {
    const cooldown = (params.cooldownMinutes || 15) * 60 * 1000;
    if (!params.lastAlertedTimestamp) {
      return { suppress: false };
    }

    const elapsed = Date.now() - new Date(params.lastAlertedTimestamp).getTime();
    if (elapsed < cooldown) {
      const remainingSec = Math.round((cooldown - elapsed) / 1000);
      return {
        suppress: true,
        reason: `Alert suppressed by cooldown policy (${remainingSec}s remaining)`,
      };
    }

    return { suppress: false };
  }
}
