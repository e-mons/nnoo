import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AskNnooAssistantService } from '@/server/ai';

export async function GET(request: NextRequest) {
  try {
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
    const limit = parseInt(searchParams.get('limit') || '20', 10);

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

    const conversations = await AskNnooAssistantService.listConversations(
      supabase,
      businessId,
      user.id,
      limit
    );

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string; retryable?: boolean };
    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorObj.code || 'AI_INTERNAL_ERROR',
          message: errorObj.message || 'Failed to list conversations.',
          retryable: false,
        },
      },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { businessId, title = 'New Conversation' } = body;

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

    const conversation = await AskNnooAssistantService.createConversation(
      supabase,
      businessId,
      user.id,
      title
    );

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string; retryable?: boolean };
    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorObj.code || 'AI_INTERNAL_ERROR',
          message: errorObj.message || 'Failed to create conversation.',
          retryable: false,
        },
      },
      { status: 400 }
    );
  }
}
