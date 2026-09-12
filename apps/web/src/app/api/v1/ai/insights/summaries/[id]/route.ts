import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BusinessSummaryDetail, BusinessSummaryType } from '@nnoo/contracts';

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_FORBIDDEN',
            message: 'You must be authenticated to view business summaries.',
            retryable: false,
          },
        },
        { status: 401 }
      );
    }

    // 2. Fetch summary record with RLS
    const { data: row, error: fetchErr } = await supabase
      .from('ai_business_summaries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !row) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_INSIGHTS_NOT_FOUND',
            message: 'Business summary not found or access denied.',
            retryable: false,
          },
        },
        { status: 404 }
      );
    }

    const detail: BusinessSummaryDetail = {
      id: row.id,
      businessId: row.business_id,
      summaryType: row.summary_type as BusinessSummaryType,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      asOfTimestamp: row.as_of_timestamp,
      businessTimezone: row.business_timezone,
      currencyCode: row.currency_code,
      headline: row.headline,
      overview: row.overview,
      selectedHighlightSignalKeys: row.selected_highlight_signal_keys as any,
      selectedAttentionSignalKeys: row.selected_attention_signal_keys as any,
      selectedActionKeys: row.selected_action_keys as any,
      sourceFingerprint: row.source_fingerprint,
      permissionScopeFingerprint: row.permission_scope_fingerprint,
      verifiedFactSnapshot: row.verified_fact_snapshot as any,
      promptVersion: row.prompt_version,
      modelId: row.model_id,
      status: row.status as any,
      isFresh: row.status === 'ready',
      createdAt: row.created_at,
    };

    return NextResponse.json({
      success: true,
      data: detail,
    });
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string; retryable?: boolean };
    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorObj.code || 'AI_INTERNAL_ERROR',
          message: errorObj.message || 'Failed to retrieve business summary.',
          retryable: false,
        },
      },
      { status: 400 }
    );
  }
}
