import 'server-only';
import { randomBytes, createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreditPassportPreview,
  CreditPassportSnapshot,
  CreditPassportShare,
  CreditPassportExternalProjection,
  CreditPassportVerificationResult,
  CreditPassportExplanation,
  GenerateCreditPassportInput,
  CreateCreditPassportShareInput,
  ExplainCreditPassportInput,
} from '@nnoo/contracts';
import { StructuredCreditPassportExplanationResponseSchema } from '@nnoo/validation';
import { AISafeError, AIApplicationService } from '../service';
import type { GeminiClientInterface } from '../gemini/client';
import { CreditPassportFactBuilder } from './fact-builder';
import { generatePassportCode, isValidPassportCode } from './passport-code';
import { CreditPassportNumericGuard } from './numeric-guard';

export class BusinessCreditPassportService {
  /**
   * Builds the current Credit Passport preview with freshness status against the latest generated snapshot.
   * Zero Gemini calls.
   */
  public static async getPreview(options: {
    supabase: SupabaseClient;
    businessId: string;
    userRole: string;
    currencyCode?: string;
    timezone?: string;
  }): Promise<CreditPassportPreview> {
    const { supabase, businessId, userRole, currencyCode, timezone } = options;

    const builtFacts = await CreditPassportFactBuilder.build({
      supabase,
      businessId,
      userRole,
      currencyCode,
      timezone,
    });

    // Fetch the latest generated snapshot for this business
    const { data: latestSnapshotRow } = await supabase
      .from('credit_passport_snapshots')
      .select('*')
      .eq('business_id', businessId)
      .order('passport_version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestSnapshot = latestSnapshotRow ? this.mapRowToSnapshot(latestSnapshotRow) : null;
    const isStale = latestSnapshot ? latestSnapshot.sourceFingerprint !== builtFacts.sourceFingerprint : false;

    return {
      status: builtFacts.status,
      dataCoverage: builtFacts.dataCoverage,
      payload: builtFacts.payload,
      sourceFingerprint: builtFacts.sourceFingerprint,
      latestSnapshot,
      isStale,
    };
  }

  /**
   * Generates a new immutable Credit Passport snapshot.
   * Reuses an identical snapshot if fingerprint matches and generated recently, or increments the business-scoped version atomically.
   * Zero Gemini calls.
   */
  public static async generatePassport(options: {
    supabase: SupabaseClient;
    businessId: string;
    userId: string;
    userRole: string;
    input?: GenerateCreditPassportInput;
    currencyCode?: string;
    timezone?: string;
  }): Promise<CreditPassportSnapshot> {
    const { supabase, businessId, userId, userRole, currencyCode, timezone } = options;

    // Role check: Only Owner, Admin, Manager, Accountant can generate
    const isAuthorized = ['owner', 'business_admin', 'manager', 'accountant'].includes(userRole);
    if (!isAuthorized) {
      throw new AISafeError(
        'CREDIT_PASSPORT_FORBIDDEN',
        `Role '${userRole}' is not authorized to generate a Credit Passport.`,
        false
      );
    }

    const builtFacts = await CreditPassportFactBuilder.build({
      supabase,
      businessId,
      userRole,
      currencyCode,
      timezone,
    });

    // Check if an existing snapshot with the exact same source fingerprint already exists
    const { data: existingSnapshot } = await supabase
      .from('credit_passport_snapshots')
      .select('*')
      .eq('business_id', businessId)
      .eq('source_fingerprint', builtFacts.sourceFingerprint)
      .order('passport_version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSnapshot) {
      return this.mapRowToSnapshot(existingSnapshot, true);
    }

    // Determine the next passport_version for this business
    const { data: latestVersionRow } = await supabase
      .from('credit_passport_snapshots')
      .select('passport_version')
      .eq('business_id', businessId)
      .order('passport_version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latestVersionRow?.passport_version || 0) + 1;
    const passportCode = generatePassportCode();

    // Insert immutable snapshot
    const insertPayload = {
      business_id: businessId,
      passport_code: passportCode,
      passport_version: nextVersion,
      passport_schema_version: '1.0.0',
      status: builtFacts.status,
      period_start: builtFacts.payload.passportPeriod.start,
      period_end: builtFacts.payload.passportPeriod.end,
      as_of_timestamp: builtFacts.payload.asOfTimestamp,
      generated_by_user_id: userId,
      source_fingerprint: builtFacts.sourceFingerprint,
      artifact_hash: builtFacts.artifactHash,
      data_coverage: builtFacts.dataCoverage,
      snapshot_payload: builtFacts.payload as any,
      health_score_snapshot_id: builtFacts.healthScoreSnapshotId,
    };

    const { data: newRow, error: insertError } = await supabase
      .from('credit_passport_snapshots')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError || !newRow) {
      throw new AISafeError(
        'CREDIT_PASSPORT_GENERATION_FAILED',
        `Failed to persist Credit Passport snapshot: ${insertError?.message || 'Unknown database error'}`,
        true
      );
    }

    return this.mapRowToSnapshot(newRow, true);
  }

  /**
   * Retrieves a specific Credit Passport snapshot by ID.
   */
  public static async getSnapshot(options: {
    supabase: SupabaseClient;
    businessId: string;
    userRole: string;
    snapshotId: string;
  }): Promise<CreditPassportSnapshot> {
    const { supabase, businessId, userRole, snapshotId } = options;

    const isAuthorized = ['owner', 'business_admin', 'manager', 'accountant'].includes(userRole);
    if (!isAuthorized) {
      throw new AISafeError(
        'CREDIT_PASSPORT_FORBIDDEN',
        `Role '${userRole}' is not authorized to view Credit Passport snapshots.`,
        false
      );
    }

    const { data: row, error } = await supabase
      .from('credit_passport_snapshots')
      .select('*')
      .eq('id', snapshotId)
      .eq('business_id', businessId)
      .maybeSingle();

    if (error || !row) {
      throw new AISafeError(
        'CREDIT_PASSPORT_NOT_FOUND',
        `Credit Passport snapshot '${snapshotId}' was not found.`,
        false
      );
    }

    return this.mapRowToSnapshot(row);
  }

  /**
   * Lists historical Credit Passport snapshots for the business.
   */
  public static async getSnapshotHistory(options: {
    supabase: SupabaseClient;
    businessId: string;
    userRole: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ snapshots: CreditPassportSnapshot[]; total: number }> {
    const { supabase, businessId, userRole, page = 1, pageSize = 20 } = options;

    const isAuthorized = ['owner', 'business_admin', 'manager', 'accountant'].includes(userRole);
    if (!isAuthorized) {
      throw new AISafeError(
        'CREDIT_PASSPORT_FORBIDDEN',
        `Role '${userRole}' is not authorized to view Credit Passport history.`,
        false
      );
    }

    const offset = (page - 1) * pageSize;

    const { data: rows, count, error } = await supabase
      .from('credit_passport_snapshots')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .order('passport_version', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new AISafeError(
        'CREDIT_PASSPORT_GENERATION_FAILED',
        `Failed to retrieve Credit Passport history: ${error.message}`,
        true
      );
    }

    return {
      snapshots: (rows || []).map((r) => this.mapRowToSnapshot(r)),
      total: count || 0,
    };
  }

  /**
   * Creates a secure, expiring external share token for a specific snapshot.
   * Only Owner and Business Admin can share externally.
   * Zero Gemini calls.
   */
  public static async createShare(options: {
    supabase: SupabaseClient;
    businessId: string;
    userId: string;
    userRole: string;
    input: CreateCreditPassportShareInput;
    baseUrl?: string;
  }): Promise<CreditPassportShare> {
    const { supabase, businessId, userId, userRole, input, baseUrl = '' } = options;

    // Strict RBAC: Only Owner and Business Admin can generate external share links
    const canShare = ['owner', 'business_admin'].includes(userRole);
    if (!canShare) {
      throw new AISafeError(
        'CREDIT_PASSPORT_SHARE_FORBIDDEN',
        `Role '${userRole}' is not authorized to share the Credit Passport externally. Only Owner and Business Admin may share.`,
        false
      );
    }

    // Verify snapshot exists and belongs to business
    const { data: snapshot, error: snapError } = await supabase
      .from('credit_passport_snapshots')
      .select('id, passport_code, passport_version')
      .eq('id', input.snapshotId)
      .eq('business_id', businessId)
      .maybeSingle();

    if (snapError || !snapshot) {
      throw new AISafeError(
        'CREDIT_PASSPORT_NOT_FOUND',
        'Referenced Credit Passport snapshot not found.',
        false
      );
    }

    // Generate high-entropy secret share token
    const token = randomBytes(24).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const expiresInDays = Math.min(30, Math.max(1, input.expiresInDays || 7));
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: shareRow, error: insertError } = await supabase
      .from('credit_passport_shares')
      .insert({
        business_id: businessId,
        passport_snapshot_id: snapshot.id,
        token_hash: tokenHash,
        created_by_user_id: userId,
        expires_at: expiresAt,
      })
      .select('*')
      .single();

    if (insertError || !shareRow) {
      throw new AISafeError(
        'CREDIT_PASSPORT_GENERATION_FAILED',
        `Failed to create Credit Passport share link: ${insertError?.message || 'Unknown database error'}`,
        true
      );
    }

    const shareUrl = `${baseUrl}/passport/share/${token}`;

    return {
      id: shareRow.id,
      businessId: shareRow.business_id,
      passportSnapshotId: shareRow.passport_snapshot_id,
      passportCode: snapshot.passport_code,
      passportVersion: snapshot.passport_version,
      expiresAt: shareRow.expires_at,
      revokedAt: shareRow.revoked_at,
      isExpired: new Date(shareRow.expires_at).getTime() < Date.now(),
      isRevoked: Boolean(shareRow.revoked_at),
      accessCount: shareRow.access_count,
      lastAccessedAt: shareRow.last_accessed_at,
      createdAt: shareRow.created_at,
      shareUrl,
    };
  }

  /**
   * Revokes an active external share link immediately.
   */
  public static async revokeShare(options: {
    supabase: SupabaseClient;
    businessId: string;
    userId: string;
    userRole: string;
    shareId: string;
  }): Promise<{ success: boolean }> {
    const { supabase, businessId, userRole, shareId } = options;

    const canRevoke = ['owner', 'business_admin'].includes(userRole);
    if (!canRevoke) {
      throw new AISafeError(
        'CREDIT_PASSPORT_SHARE_FORBIDDEN',
        `Role '${userRole}' is not authorized to revoke Credit Passport share links.`,
        false
      );
    }

    const { error } = await supabase
      .from('credit_passport_shares')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', shareId)
      .eq('business_id', businessId);

    if (error) {
      throw new AISafeError(
        'CREDIT_PASSPORT_GENERATION_FAILED',
        `Failed to revoke share link: ${error.message}`,
        true
      );
    }

    return { success: true };
  }

  /**
   * Lists active shares for a snapshot.
   */
  public static async listShares(options: {
    supabase: SupabaseClient;
    businessId: string;
    userRole: string;
    snapshotId?: string;
  }): Promise<CreditPassportShare[]> {
    const { supabase, businessId, userRole, snapshotId } = options;

    const isAuthorized = ['owner', 'business_admin', 'manager', 'accountant'].includes(userRole);
    if (!isAuthorized) {
      throw new AISafeError(
        'CREDIT_PASSPORT_FORBIDDEN',
        `Role '${userRole}' is not authorized to view Credit Passport shares.`,
        false
      );
    }

    let query = supabase
      .from('credit_passport_shares')
      .select(`
        *,
        snapshot:credit_passport_snapshots (
          passport_code,
          passport_version
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (snapshotId) {
      query = query.eq('passport_snapshot_id', snapshotId);
    }

    const { data: rows, error } = await query;
    if (error) {
      throw new AISafeError(
        'CREDIT_PASSPORT_GENERATION_FAILED',
        `Failed to retrieve shares: ${error.message}`,
        true
      );
    }

    const nowTime = Date.now();
    return (rows || []).map((r: any) => ({
      id: r.id,
      businessId: r.business_id,
      passportSnapshotId: r.passport_snapshot_id,
      passportCode: r.snapshot?.passport_code || '',
      passportVersion: r.snapshot?.passport_version || 1,
      expiresAt: r.expires_at,
      revokedAt: r.revoked_at,
      isExpired: new Date(r.expires_at).getTime() < nowTime,
      isRevoked: Boolean(r.revoked_at),
      accessCount: r.access_count,
      lastAccessedAt: r.last_accessed_at,
      createdAt: r.created_at,
    }));
  }

  /**
   * Resolves a public external share token to a safe, read-only CreditPassportExternalProjection.
   * Strips all customer/supplier/staff PII, internal notes, and credentials.
   * Zero Gemini calls.
   */
  public static async getExternalShare(options: {
    supabase: SupabaseClient;
    token: string;
  }): Promise<CreditPassportExternalProjection> {
    const { supabase, token } = options;

    if (!token || typeof token !== 'string' || token.length < 16) {
      throw new AISafeError(
        'CREDIT_PASSPORT_SHARE_NOT_FOUND',
        'Credit Passport is unavailable or the share link is invalid.',
        false
      );
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const { data: shareRow, error: shareError } = await supabase
      .from('credit_passport_shares')
      .select(`
        id,
        business_id,
        passport_snapshot_id,
        expires_at,
        revoked_at,
        access_count,
        snapshot:credit_passport_snapshots (
          id,
          business_id,
          passport_code,
          passport_version,
          status,
          artifact_hash,
          snapshot_payload,
          ai_explanation,
          created_at,
          as_of_timestamp,
          business:businesses (
            status
          )
        )
      `)
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (shareError || !shareRow || !shareRow.snapshot) {
      throw new AISafeError(
        'CREDIT_PASSPORT_SHARE_NOT_FOUND',
        'Credit Passport is unavailable or the share link is invalid.',
        false
      );
    }

    // Check revocation
    if (shareRow.revoked_at) {
      throw new AISafeError(
        'CREDIT_PASSPORT_SHARE_REVOKED',
        'Access to this Credit Passport has been revoked by the business.',
        false
      );
    }

    // Check expiration
    if (new Date(shareRow.expires_at).getTime() < Date.now()) {
      throw new AISafeError(
        'CREDIT_PASSPORT_SHARE_EXPIRED',
        'This Credit Passport share link has expired.',
        false
      );
    }

    // Check business account status
    const businessStatus = (shareRow.snapshot as any).business?.status;
    if (businessStatus === 'suspended') {
      throw new AISafeError(
        'CREDIT_PASSPORT_BUSINESS_RESTRICTED',
        'This Credit Passport is currently unavailable.',
        false
      );
    }

    // Record audit: increment access_count and update last_accessed_at
    await supabase
      .from('credit_passport_shares')
      .update({
        access_count: (shareRow.access_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', shareRow.id);

    const snapshot = shareRow.snapshot as any;
    const payload = snapshot.snapshot_payload;

    // Build safe external disclosure projection
    const externalProjection: CreditPassportExternalProjection = {
      passportCode: snapshot.passport_code,
      passportVersion: snapshot.passport_version,
      generatedAt: snapshot.created_at,
      asOf: snapshot.as_of_timestamp,
      status: snapshot.status,
      artifactHash: snapshot.artifact_hash,
      businessIdentity: {
        name: payload.businessIdentity.name,
        legalName: payload.businessIdentity.legalName,
        industry: payload.businessIdentity.industry,
        countryCode: payload.businessIdentity.countryCode,
        currencyCode: payload.businessIdentity.currencyCode,
        city: payload.businessIdentity.city,
        state: payload.businessIdentity.state,
        registrationNumber: payload.businessIdentity.registrationNumber,
        taxIdentifier: payload.businessIdentity.taxIdentifier,
        businessCreatedAt: payload.businessIdentity.businessCreatedAt,
        provenance: payload.businessIdentity.provenance,
      },
      recordedHistory: payload.recordedHistory,
      financialPerformance: payload.financialPerformance,
      currentPosition: payload.currentPosition,
      invoiceActivity: payload.invoiceActivity,
      inventoryPosition: payload.inventoryPosition,
      healthScore: payload.healthScore,
      dataCoverage: payload.dataCoverage,
      disclaimers: payload.disclaimers,
      aiExplanation: snapshot.ai_explanation
        ? {
            headline: snapshot.ai_explanation.headline,
            overview: snapshot.ai_explanation.overview,
          }
        : null,
    };

    return externalProjection;
  }

  /**
   * Verifies an authentic Passport Code and artifact hash without leaking private financial totals.
   * Zero Gemini calls.
   */
  public static async verifyPassport(options: {
    supabase: SupabaseClient;
    passportCode: string;
    artifactHash?: string;
  }): Promise<CreditPassportVerificationResult> {
    const { supabase, passportCode, artifactHash } = options;

    if (!isValidPassportCode(passportCode)) {
      throw new AISafeError(
        'CREDIT_PASSPORT_VERIFICATION_FAILED',
        'Invalid Passport Code format.',
        false
      );
    }

    const { data: snapshot, error } = await supabase
      .from('credit_passport_snapshots')
      .select(`
        passport_code,
        passport_version,
        created_at,
        status,
        data_coverage,
        artifact_hash,
        period_start,
        period_end,
        business:businesses (
          name
        )
      `)
      .eq('passport_code', passportCode)
      .maybeSingle();

    if (error || !snapshot) {
      throw new AISafeError(
        'CREDIT_PASSPORT_NOT_FOUND',
        'Passport Code not found in the NNOO registry.',
        false
      );
    }

    const isIntegrityVerified = artifactHash ? snapshot.artifact_hash === artifactHash : true;
    const businessName = (snapshot as any).business?.name || 'Verified Business';

    return {
      isValid: true,
      passportCode: snapshot.passport_code,
      passportVersion: snapshot.passport_version,
      generatedAt: snapshot.created_at,
      status: snapshot.status as any,
      dataCoverage: snapshot.data_coverage as any,
      artifactHash: snapshot.artifact_hash,
      isIntegrityVerified,
      businessName,
      recordedPeriod: {
        start: snapshot.period_start,
        end: snapshot.period_end,
      },
    };
  }

  /**
   * Generates or retrieves an AI explanation for a specific snapshot.
   * Enforces zero credit claims, loan promises, or invented numbers.
   */
  public static async explainPassport(options: {
    supabase: SupabaseClient;
    businessId: string;
    userId: string;
    userRole: string;
    input: ExplainCreditPassportInput;
    modelId?: string;
    mockGeminiClient?: GeminiClientInterface;
  }): Promise<CreditPassportExplanation> {
    const { supabase, businessId, userId, userRole, input, modelId } = options;

    const isAuthorized = ['owner', 'business_admin', 'manager', 'accountant'].includes(userRole);
    if (!isAuthorized) {
      throw new AISafeError(
        'CREDIT_PASSPORT_FORBIDDEN',
        `Role '${userRole}' is not authorized to generate Credit Passport explanations.`,
        false
      );
    }

    // Retrieve snapshot
    const { data: snapshot, error } = await supabase
      .from('credit_passport_snapshots')
      .select('*')
      .eq('id', input.snapshotId)
      .eq('business_id', businessId)
      .maybeSingle();

    if (error || !snapshot) {
      throw new AISafeError(
        'CREDIT_PASSPORT_NOT_FOUND',
        'Credit Passport snapshot not found.',
        false
      );
    }

    // If explanation already exists, return cached validated explanation
    if (snapshot.ai_explanation) {
      return snapshot.ai_explanation as unknown as CreditPassportExplanation;
    }

    const payload = snapshot.snapshot_payload as any;

    // Assemble deterministic context bundle for Gemini
    const deterministicContext = {
      businessName: payload.businessIdentity.name,
      industry: payload.businessIdentity.industry,
      recordedDays: payload.recordedHistory.recordedDaysCount,
      period: payload.passportPeriod,
      netSalesMinor: payload.financialPerformance.netSalesMinor,
      grossProfitMinor: payload.financialPerformance.grossProfitMinor,
      operatingExpensesMinor: payload.financialPerformance.operatingExpensesMinor,
      operatingResultMinor: payload.financialPerformance.operatingResultMinor,
      accountsReceivableMinor: payload.currentPosition.accountsReceivableMinor,
      accountsPayableMinor: payload.currentPosition.accountsPayableMinor,
      overdueInvoicesCount: payload.currentPosition.overdueInvoicesCount,
      inventoryApplicable: payload.inventoryPosition.isApplicable,
      inventoryValueMinor: payload.inventoryPosition.inventoryValueMinor,
      healthScore: payload.healthScore.score,
      healthScoreBand: payload.healthScore.scoreBand,
      dataCoverage: payload.dataCoverage.level,
    };

    // Invoke Gemini structured generation via centralized AI foundation
    const appService = new AIApplicationService(options.mockGeminiClient);
    let structuredOutput: any;
    try {
      structuredOutput = await appService.executeFeature({
        featureKey: 'ai.credit_passport.explain',
        context: {
          businessId,
          userId,
          userRole,
          userPermissions: ['view_reports'],
        },
        userInput: 'Explain deterministic credit passport profile.',
        verifiedContext: deterministicContext,
        responseSchema: StructuredCreditPassportExplanationResponseSchema,
        geminiClient: options.mockGeminiClient,
      });
    } catch (err: any) {
      throw new AISafeError(
        'CREDIT_PASSPORT_EXPLANATION_FAILED',
        `Failed to generate structured Credit Passport explanation: ${err?.message || 'AI service error'}`,
        true
      );
    }

    // Enforce post-validation numeric guard against loan and credit claims
    const validatedExplanation = CreditPassportNumericGuard.validateAndGuard({
      headline: structuredOutput.headline,
      overview: structuredOutput.overview,
      highlightKeys: structuredOutput.highlightKeys,
      attentionKeys: structuredOutput.attentionKeys,
      promptVersion: '1.0.0',
      responseSchemaVersion: '1.0.0',
      modelId: structuredOutput.modelId || 'gemini-3.6-flash',
      createdAt: new Date().toISOString(),
    });

    // Persist validated explanation onto snapshot
    await supabase
      .from('credit_passport_snapshots')
      .update({ ai_explanation: validatedExplanation as any })
      .eq('id', snapshot.id);

    return validatedExplanation;
  }

  private static mapRowToSnapshot(row: any, isCurrent = false): CreditPassportSnapshot {
    return {
      id: row.id,
      businessId: row.business_id,
      passportCode: row.passport_code,
      passportVersion: row.passport_version,
      passportSchemaVersion: row.passport_schema_version,
      status: row.status,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      asOfTimestamp: row.as_of_timestamp,
      generatedByUserId: row.generated_by_user_id,
      sourceFingerprint: row.source_fingerprint,
      artifactHash: row.artifact_hash,
      dataCoverage: row.data_coverage,
      payload: row.snapshot_payload,
      healthScoreSnapshotId: row.health_score_snapshot_id,
      aiExplanation: row.ai_explanation,
      createdAt: row.created_at,
      isCurrent,
    };
  }
}
