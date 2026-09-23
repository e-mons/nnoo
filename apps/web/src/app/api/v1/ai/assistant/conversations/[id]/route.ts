import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AskNnooAssistantService } from '@/server/ai';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createClient();
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
            message: 'Authentication is required.',
            retryable: false,
          },
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ASK_NNOO_INVALID_MESSAGE',
            message: 'Missing required businessId parameter.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('business_memberships')
      .select('role, membership_status')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ASK_NNOO_FORBIDDEN',
            message: 'User does not belong to the specified business or membership is inactive.',
            retryable: false,
          },
        },
        { status: 403 }
      );
    }

    const detail = await AskNnooAssistantService.getConversation(
      supabase,
      businessId,
      user.id,
      membership.role,
      conversationId
    );

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
          message: errorObj.message || 'Failed to fetch conversation details.',
          retryable: false,
        },
      },
      { status: errorObj.code === 'ASK_NNOO_FORBIDDEN' ? 403 : errorObj.code === 'ASK_NNOO_NOT_FOUND' ? 404 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createClient();
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
            message: 'Authentication is required.',
            retryable: false,
          },
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ASK_NNOO_INVALID_MESSAGE',
            message: 'Missing required businessId parameter.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    // Verify active membership before archiving
    const { data: membership } = await supabase
      .from('business_memberships')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ASK_NNOO_FORBIDDEN',
            message: 'User does not belong to the specified business or membership is inactive.',
            retryable: false,
          },
        },
        { status: 403 }
      );
    }

    await AskNnooAssistantService.archiveConversation(
      supabase,
      businessId,
      user.id,
      conversationId
    );

    return NextResponse.json({
      success: true,
      message: 'Conversation archived.',
    });
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string; retryable?: boolean };
    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorObj.code || 'AI_INTERNAL_ERROR',
          message: errorObj.message || 'Failed to archive conversation.',
          retryable: false,
        },
      },
      { status: 400 }
    );
  }
}
