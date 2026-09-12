import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BusinessHealthScoreResult,
  BusinessHealthScoreSnapshot,
  BusinessHealthExplanation,
  RefreshBusinessHealthScoreInput,
  ExplainBusinessHealthScoreInput,
} from '@nnoo/contracts';
import { StructuredHealthExplanationResponseSchema } from '@nnoo/validation';
import { AIApplicationService, AISafeError } from '../service';
import { type GeminiClientInterface } from '../gemini/client';
import { HealthScoreInputBuilder } from './input-builder';
import { BusinessHealthCalculator } from './calculator';
import { HealthScoreNumericGuard } from './numeric-guard';

export interface HealthServiceContext {
  supabase: SupabaseClient;
  businessId: string;
  userId: string;
  userRole: string;
  currencyCode?: string;
  timezone?: string;
}

export class BusinessHealthService {
  /**
   * Retrieves the current Business Health Score.
   * Deterministic calculation. Uses ZERO Gemini calls.
   */
  public static async getCurrentScore(context: HealthServiceContext): Promise<BusinessHealthScoreResult> {
    const { supabase, businessId, userRole, currencyCode, timezone } = context;

    // 1. Build raw inputs from canonical RPCs
    const rawInputs = await HealthScoreInputBuilder.buildInputs({
      supabase,
      businessId,
      userRole,
      currencyCode,
      timezone,
    });

    // 2. Deterministically calculate score
    const scoreResult = BusinessHealthCalculator.calculate(rawInputs);

    // 3. Check for existing snapshot with identical fingerprint
    const { data: existingSnapshot } = await supabase
      .from('ai_business_health_snapshots')
      .select('*')
      .eq('business_id', businessId)
      .eq('formula_version', scoreResult.formulaVersion)
      .eq('source_fingerprint', scoreResult.sourceFingerprint)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSnapshot && existingSnapshot.ai_explanation) {
      scoreResult.explanation = existingSnapshot.ai_explanation as unknown as BusinessHealthExplanation;
    }

    return scoreResult;
  }

  /**
   * Refreshes the Business Health Score and persists a snapshot idempotently.
   * Uses ZERO Gemini calls.
   */
  public static async refreshScore(
    context: HealthServiceContext,
    input?: RefreshBusinessHealthScoreInput
  ): Promise<BusinessHealthScoreSnapshot> {
    const { supabase, businessId, userId, userRole, currencyCode, timezone } = context;

    // 1. Build raw inputs and calculate deterministic score
    const rawInputs = await HealthScoreInputBuilder.buildInputs({
      supabase,
      businessId,
      userRole,
      currencyCode,
      timezone,
    });

    const scoreResult = BusinessHealthCalculator.calculate(rawInputs);

    // 2. Check for identical active snapshot to avoid redundant row creation
    const { data: existingSnapshot } = await supabase
      .from('ai_business_health_snapshots')
      .select('*')
      .eq('business_id', businessId)
      .eq('formula_version', scoreResult.formulaVersion)
      .eq('source_fingerprint', scoreResult.sourceFingerprint)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSnapshot) {
      return {
        ...scoreResult,
        id: existingSnapshot.id,
        businessId: existingSnapshot.business_id,
        createdByUserId: existingSnapshot.created_by_user_id,
        createdAt: existingSnapshot.created_at,
        explanation: existingSnapshot.ai_explanation as unknown as BusinessHealthExplanation | null,
      };
    }

    // 3. Persist new snapshot using service client
    const { data: newSnapshot, error: insertError } = await supabase
      .from('ai_business_health_snapshots')
      .insert({
        business_id: businessId,
        formula_version: scoreResult.formulaVersion,
        status: scoreResult.status === 'READY' ? 'ready' : 'insufficient_data',
        score: scoreResult.score,
        score_band: scoreResult.scoreBand ? scoreResult.scoreBand.toLowerCase() : null,
        data_coverage: scoreResult.dataCoverage.toLowerCase(),
        evaluation_period_start: scoreResult.evaluationPeriod.start,
        evaluation_period_end: scoreResult.evaluationPeriod.end,
        as_of_timestamp: scoreResult.asOfTimestamp,
        business_timezone: scoreResult.businessTimezone,
        currency_code: scoreResult.currencyCode || 'NGN',
        source_fingerprint: scoreResult.sourceFingerprint,
        applicable_dimension_keys: scoreResult.applicableDimensionKeys,
        dimension_results: scoreResult.dimensions,
        strength_reason_keys: scoreResult.strengthReasonKeys,
        attention_reason_keys: scoreResult.attentionReasonKeys,
        action_keys: scoreResult.actionKeys,
        created_by_user_id: userId,
      })
      .select('*')
      .single();

    if (insertError || !newSnapshot) {
      throw new AISafeError(
        'BUSINESS_HEALTH_CALCULATION_FAILED',
        `Failed to persist health score snapshot: ${insertError?.message || 'Unknown database error'}`,
        true
      );
    }

    return {
      ...scoreResult,
      id: newSnapshot.id,
      businessId: newSnapshot.business_id,
      createdByUserId: newSnapshot.created_by_user_id,
      createdAt: newSnapshot.created_at,
      explanation: null,
    };
  }

  /**
   * Retrieves historical score snapshots for timeline review.
   * Uses ZERO Gemini calls.
   */
  public static async getScoreHistory(
    context: HealthServiceContext,
    limit: number = 20
  ): Promise<BusinessHealthScoreSnapshot[]> {
    const { supabase, businessId, userRole } = context;

    const isAuthorizedRole = ['owner', 'business_admin', 'manager', 'accountant'].includes(userRole);
    if (!isAuthorizedRole) {
      throw new AISafeError(
        'BUSINESS_HEALTH_FORBIDDEN',
        `Role '${userRole}' is not authorized to view Business Health Score history.`,
        false
      );
    }

    const { data: snapshots, error } = await supabase
      .from('ai_business_health_snapshots')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 50));

    if (error) {
      throw new AISafeError(
        'BUSINESS_HEALTH_CALCULATION_FAILED',
        `Failed to retrieve health score history: ${error.message}`,
        true
      );
    }

    return (snapshots || []).map((row) => ({
      id: row.id,
      businessId: row.business_id,
      createdByUserId: row.created_by_user_id,
      createdAt: row.created_at,
      formulaVersion: row.formula_version,
      status: row.status === 'ready' ? 'READY' : 'INSUFFICIENT_DATA',
      score: row.score,
      scoreBand: row.score_band ? (row.score_band.toUpperCase() as any) : null,
      dataCoverage: row.data_coverage.toUpperCase() as any,
      evaluationPeriod: {
        start: row.evaluation_period_start,
        end: row.evaluation_period_end,
      },
      asOfTimestamp: row.as_of_timestamp,
      businessTimezone: row.business_timezone,
      currencyCode: row.currency_code,
      sourceFingerprint: row.source_fingerprint,
      applicableDimensionKeys: (row.applicable_dimension_keys as any) || [],
      dimensions: (row.dimension_results as any) || [],
      strengthReasonKeys: (row.strength_reason_keys as any) || [],
      attentionReasonKeys: (row.attention_reason_keys as any) || [],
      actionKeys: (row.action_keys as any) || [],
      explanation: row.ai_explanation as unknown as BusinessHealthExplanation | null,
    }));
  }

  /**
   * Generates a grounded, structured AI narrative explanation for the health score.
   */
  public static async explainScore(
    context: HealthServiceContext,
    input?: ExplainBusinessHealthScoreInput,
    mockGeminiClient?: GeminiClientInterface
  ): Promise<BusinessHealthExplanation> {
    const { supabase, businessId, userId, userRole, currencyCode, timezone } = context;

    // 1. Fetch current score or snapshot
    let snapshot: BusinessHealthScoreSnapshot;
    if (input?.snapshotId) {
      const { data: snapRow, error } = await supabase
        .from('ai_business_health_snapshots')
        .select('*')
        .eq('id', input.snapshotId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (error || !snapRow) {
        throw new AISafeError(
          'BUSINESS_HEALTH_SNAPSHOT_NOT_FOUND',
          'Specified health score snapshot not found.',
          false
        );
      }

      snapshot = {
        id: snapRow.id,
        businessId: snapRow.business_id,
        createdByUserId: snapRow.created_by_user_id,
        createdAt: snapRow.created_at,
        formulaVersion: snapRow.formula_version,
        status: snapRow.status === 'ready' ? 'READY' : 'INSUFFICIENT_DATA',
        score: snapRow.score,
        scoreBand: snapRow.score_band ? (snapRow.score_band.toUpperCase() as any) : null,
        dataCoverage: snapRow.data_coverage.toUpperCase() as any,
        evaluationPeriod: {
          start: snapRow.evaluation_period_start,
          end: snapRow.evaluation_period_end,
        },
        asOfTimestamp: snapRow.as_of_timestamp,
        businessTimezone: snapRow.business_timezone,
        currencyCode: snapRow.currency_code,
        sourceFingerprint: snapRow.source_fingerprint,
        applicableDimensionKeys: (snapRow.applicable_dimension_keys as any) || [],
        dimensions: (snapRow.dimension_results as any) || [],
        strengthReasonKeys: (snapRow.strength_reason_keys as any) || [],
        attentionReasonKeys: (snapRow.attention_reason_keys as any) || [],
        actionKeys: (snapRow.action_keys as any) || [],
        explanation: snapRow.ai_explanation as unknown as BusinessHealthExplanation | null,
      };
    } else {
      snapshot = await this.refreshScore(context);
    }

    if (snapshot.status === 'INSUFFICIENT_DATA') {
      return {
        headline: 'Not enough business data recorded yet',
        overview: 'Your business does not yet have enough recorded transactions in NNOO to generate a full operational health explanation. Once you record sales, expenses, and invoices, NNOO will analyze your performance.',
        strengthReasonKeys: [],
        attentionReasonKeys: ['DATA_COVERAGE_INSUFFICIENT'],
        actionKeys: ['OPEN_SALES_REPORT', 'OPEN_EXPENSE_REPORT'],
        promptVersion: '1.0.0',
        responseSchemaVersion: '1.0.0',
        modelId: 'gemini-3.6-flash',
        createdAt: new Date().toISOString(),
      };
    }

    // Reuse existing explanation if present
    if (snapshot.explanation) {
      return snapshot.explanation;
    }

    // 2. Prepare structured context for Gemini
    const explanationContext = {
      score: snapshot.score,
      scoreBand: snapshot.scoreBand,
      dataCoverage: snapshot.dataCoverage,
      evaluationPeriod: snapshot.evaluationPeriod,
      applicableDimensions: snapshot.dimensions.map((d) => ({
        key: d.key,
        name: d.name,
        score: d.score,
        status: d.status,
        reasons: d.reasonKeys,
      })),
      strengthReasonKeys: snapshot.strengthReasonKeys,
      attentionReasonKeys: snapshot.attentionReasonKeys,
      allowedActionKeys: snapshot.actionKeys,
    };

    // 3. Invoke Gemini via AIApplicationService
    const appService = new AIApplicationService(mockGeminiClient);
    let structuredOutput: any;
    try {
      structuredOutput = await appService.executeFeature({
        featureKey: 'ai.health.explain',
        context: {
          businessId,
          userId,
          userRole,
          userPermissions: ['view_reports'],
        },
        userInput: `Explain deterministic business health score.`,
        verifiedContext: explanationContext,
        responseSchema: StructuredHealthExplanationResponseSchema,
        geminiClient: mockGeminiClient,
      });
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string; retryable?: boolean };
      const code = (errorObj.code as any) || 'BUSINESS_HEALTH_EXPLANATION_FAILED';
      throw new AISafeError(code, errorObj.message || 'Failed to generate health score explanation.', errorObj.retryable ?? true);
    }

    // 4. Guard and validate Gemini output
    const validatedExplanation = HealthScoreNumericGuard.validateExplanation(
      {
        headline: structuredOutput.headline,
        overview: structuredOutput.overview,
        strengthReasonKeys: structuredOutput.strengthReasonKeys as any,
        attentionReasonKeys: structuredOutput.attentionReasonKeys as any,
        actionKeys: structuredOutput.actionKeys as any,
      },
      {
        deterministicScore: snapshot.score,
        deterministicBand: snapshot.scoreBand,
        allowedReasonKeys: [...snapshot.strengthReasonKeys, ...snapshot.attentionReasonKeys],
        allowedActionKeys: snapshot.actionKeys,
      }
    );

    const fullExplanation: BusinessHealthExplanation = {
      ...validatedExplanation,
      promptVersion: '1.0.0',
      responseSchemaVersion: '1.0.0',
      modelId: 'gemini-3.6-flash',
      createdAt: new Date().toISOString(),
    };

    // 5. Update snapshot with the explanation
    await supabase
      .from('ai_business_health_snapshots')
      .update({ ai_explanation: fullExplanation as any })
      .eq('id', snapshot.id);

    return fullExplanation;
  }
}
