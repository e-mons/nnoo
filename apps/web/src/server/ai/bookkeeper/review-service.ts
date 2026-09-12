import { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import type { Database } from '@nnoo/supabase/database.types';
import type {
  ApplyBookkeepingInput,
  BookkeepingApplicationResult,
  BookkeepingClassificationStatus,
  BookkeepingFinalOperationKind,
  BookkeepingInboxItem,
  BookkeepingReviewDetail,
  CorrectBookkeepingInput,
  RejectBookkeepingInput,
} from '@nnoo/contracts/ai';
import { AISafeError } from '../service';
import { BOOKKEEPER_ADAPTERS } from './adapters';

export interface ReviewRequestContext {
  businessId: string;
  userId: string;
  role: string;
}

const REVIEW_PERMITTED_ROLES = ['owner', 'business_admin', 'manager', 'accountant'];

const OPERATION_PERMITTED_ROLES: Record<BookkeepingFinalOperationKind, string[]> = {
  OPERATING_EXPENSE: ['owner', 'business_admin', 'manager', 'accountant'],
  STOCK_PURCHASE: ['owner', 'business_admin', 'manager', 'inventory_staff'],
  CUSTOMER_PAYMENT: ['owner', 'business_admin', 'manager', 'sales_staff', 'accountant'],
  SUPPLIER_PAYMENT: ['owner', 'business_admin', 'manager', 'accountant'],
  SALE: ['owner', 'business_admin', 'manager', 'sales_staff'],
  REFUND: ['owner', 'business_admin', 'manager', 'sales_staff'],
};

export class AIBookkeeperReviewService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  private computeFingerprint(data: unknown): string {
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private verifyReviewRole(role: string): void {
    if (!REVIEW_PERMITTED_ROLES.includes(role)) {
      throw new AISafeError(
        'AI_BOOKKEEPER_REVIEW_FORBIDDEN',
        `Role "${role}" is not permitted to review or manage AI Bookkeeper suggestions.`,
        false
      );
    }
  }

  private verifyOperationRole(role: string, operationKind: BookkeepingFinalOperationKind): void {
    const permitted = OPERATION_PERMITTED_ROLES[operationKind];
    if (!permitted || !permitted.includes(role)) {
      throw new AISafeError(
        'AI_BOOKKEEPER_REVIEW_FORBIDDEN',
        `Role "${role}" lacks canonical permission to execute ${operationKind} operations.`,
        false
      );
    }
  }

  async getInbox(
    context: ReviewRequestContext,
    options?: {
      status?: BookkeepingClassificationStatus;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ items: BookkeepingInboxItem[]; total: number; page: number; limit: number }> {
    this.verifyReviewRole(context.role);

    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 20));
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('ai_bookkeeping_classifications')
      .select('*, ai_bookkeeping_applications(canonical_target_type, canonical_target_id)', { count: 'exact' })
      .eq('business_id', context.businessId);

    if (options?.status) {
      query = query.eq('classification_status', options.status);
    }

    if (options?.search && options.search.trim()) {
      const term = options.search.trim();
      query = query.or(`description.ilike.%${term}%,reference_text.ilike.%${term}%,counterparty_text.ilike.%${term}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      throw new AISafeError('AI_INTERNAL_ERROR', error.message || 'Failed to fetch review inbox.', true);
    }

    const items: BookkeepingInboxItem[] = (data || []).map((row: any) => {
      const applications = row.ai_bookkeeping_applications || [];
      const primaryApp = applications[0];

      return {
        id: row.id,
        businessId: row.business_id,
        description: row.description,
        amountMinor: row.amount_minor,
        currencyCode: row.currency_code,
        transactionDirection: row.transaction_direction as any,
        transactionDate: row.transaction_date,
        operationKind: row.operation_kind as any,
        confidenceBand: row.confidence_band as any,
        classificationStatus: row.classification_status as any,
        warningCount: Array.isArray(row.warning_codes) ? row.warning_codes.length : 0,
        missingFieldCount: Array.isArray(row.missing_fields) ? row.missing_fields.length : 0,
        shortExplanation: row.short_explanation,
        createdAt: row.created_at,
        appliedTargetType: primaryApp?.canonical_target_type || null,
        appliedTargetId: primaryApp?.canonical_target_id || null,
      };
    });

    return {
      items,
      total: count || 0,
      page,
      limit,
    };
  }

  async getDetail(context: ReviewRequestContext, classificationId: string): Promise<BookkeepingReviewDetail> {
    this.verifyReviewRole(context.role);

    const { data: classification, error } = await this.supabase
      .from('ai_bookkeeping_classifications')
      .select(
        `
        *,
        expense_categories:expense_category_candidate_id(id, name),
        suppliers:supplier_candidate_id(id, name),
        customers:customer_candidate_id(id, name),
        ai_bookkeeping_reviews(*),
        ai_bookkeeping_applications(*)
      `
      )
      .eq('id', classificationId)
      .eq('business_id', context.businessId)
      .maybeSingle();

    if (error || !classification) {
      throw new AISafeError('AI_BOOKKEEPER_REVIEW_NOT_FOUND', 'Bookkeeping suggestion not found.', false);
    }

    const reviews = ((classification as any).ai_bookkeeping_reviews || []).map((r: any) => ({
      id: r.id,
      reviewerUserId: r.reviewer_user_id,
      reviewAction: r.review_action,
      aiOperationKind: r.ai_operation_kind,
      finalOperationKind: r.final_operation_kind,
      reviewNotes: r.review_notes,
      createdAt: r.created_at,
    }));

    const applications = (classification as any).ai_bookkeeping_applications || [];
    const application = applications[0]
      ? {
          applicationId: applications[0].id,
          classificationId: classification.id,
          canonicalTargetType: applications[0].canonical_target_type as any,
          canonicalTargetId: applications[0].canonical_target_id,
          receiptId: applications[0].stock_receipt_id,
          status: applications[0].status as any,
          appliedAt: applications[0].applied_at,
        }
      : null;

    return {
      id: classification.id,
      businessId: classification.business_id,
      requestedByUserId: classification.requested_by_user_id,
      description: classification.description,
      amountMinor: classification.amount_minor,
      currencyCode: classification.currency_code,
      transactionDirection: classification.transaction_direction as any,
      transactionDate: classification.transaction_date,
      paymentMethod: classification.payment_method,
      referenceText: classification.reference_text,
      counterpartyText: classification.counterparty_text,
      inputFingerprint: classification.input_fingerprint,
      idempotencyKey: classification.idempotency_key,
      operationKind: classification.operation_kind as any,
      confidenceBand: classification.confidence_band as any,
      categorySuggestion: (classification as any).expense_categories
        ? {
            id: (classification as any).expense_categories.id,
            name: (classification as any).expense_categories.name,
          }
        : null,
      supplierSuggestion: (classification as any).suppliers
        ? {
            id: (classification as any).suppliers.id,
            name: (classification as any).suppliers.name,
          }
        : null,
      customerSuggestion: (classification as any).customers
        ? {
            id: (classification as any).customers.id,
            name: (classification as any).customers.name,
          }
        : null,
      possibleDuplicateIds: Array.isArray(classification.possible_duplicate_ids)
        ? (classification.possible_duplicate_ids as string[])
        : [],
      missingFields: (classification.missing_fields as any) || [],
      warningCodes: (classification.warning_codes as any) || [],
      shortExplanation: classification.short_explanation,
      requiresHumanReview: true,
      promptVersion: classification.prompt_version,
      responseSchemaVersion: classification.response_schema_version,
      modelId: classification.model_id,
      aiInvocationId: classification.ai_invocation_id,
      classificationStatus: classification.classification_status as any,
      createdAt: classification.created_at,
      supersededAt: classification.superseded_at,
      reviews,
      application,
    };
  }

  async correctSuggestion(
    input: CorrectBookkeepingInput,
    context: ReviewRequestContext
  ): Promise<{ success: true; reviewId: string }> {
    this.verifyReviewRole(context.role);

    const { data: classification, error: fetchErr } = await this.supabase
      .from('ai_bookkeeping_classifications')
      .select('id, business_id, operation_kind, expense_category_candidate_id, supplier_candidate_id, customer_candidate_id, classification_status')
      .eq('id', input.classificationId)
      .eq('business_id', context.businessId)
      .maybeSingle();

    if (fetchErr || !classification) {
      throw new AISafeError('AI_BOOKKEEPER_REVIEW_NOT_FOUND', 'Bookkeeping suggestion not found.', false);
    }

    if (classification.classification_status === 'applied') {
      throw new AISafeError('AI_BOOKKEEPER_ALREADY_APPLIED', 'Cannot correct an already-applied classification.', false);
    }
    if (classification.classification_status === 'rejected') {
      throw new AISafeError('AI_BOOKKEEPER_ALREADY_REJECTED', 'Cannot correct a rejected classification.', false);
    }

    // Determine correction states
    const categoryState =
      input.correctedCategoryId === classification.expense_category_candidate_id
        ? 'accepted'
        : input.correctedCategoryId
        ? 'corrected'
        : 'not_applicable';

    const counterpartyState =
      input.correctedSupplierId === classification.supplier_candidate_id ||
      input.correctedCustomerId === classification.customer_candidate_id
        ? 'accepted'
        : input.correctedSupplierId || input.correctedCustomerId
        ? 'corrected'
        : 'not_applicable';

    const duplicateState = input.duplicateWarningAcknowledged ? 'acknowledged' : 'none';

    const { data: review, error: insertErr } = await this.supabase
      .from('ai_bookkeeping_reviews')
      .insert({
        business_id: context.businessId,
        classification_id: input.classificationId,
        reviewer_user_id: context.userId,
        review_action: 'corrected',
        ai_operation_kind: classification.operation_kind,
        final_operation_kind: input.correctedOperationKind,
        category_correction_state: categoryState,
        counterparty_correction_state: counterpartyState,
        duplicate_warning_state: duplicateState,
        review_notes: input.reviewNotes || null,
      })
      .select('id')
      .single();

    if (insertErr || !review) {
      throw new AISafeError('AI_INTERNAL_ERROR', insertErr?.message || 'Failed to save review correction.', true);
    }

    return { success: true, reviewId: review.id };
  }

  async rejectSuggestion(
    input: RejectBookkeepingInput,
    context: ReviewRequestContext
  ): Promise<{ success: true; reviewId: string }> {
    this.verifyReviewRole(context.role);

    const { data: classification, error: fetchErr } = await this.supabase
      .from('ai_bookkeeping_classifications')
      .select('id, business_id, operation_kind, classification_status')
      .eq('id', input.classificationId)
      .eq('business_id', context.businessId)
      .maybeSingle();

    if (fetchErr || !classification) {
      throw new AISafeError('AI_BOOKKEEPER_REVIEW_NOT_FOUND', 'Bookkeeping suggestion not found.', false);
    }

    if (classification.classification_status === 'applied') {
      throw new AISafeError('AI_BOOKKEEPER_ALREADY_APPLIED', 'Cannot reject an already-applied classification.', false);
    }
    if (classification.classification_status === 'rejected') {
      throw new AISafeError('AI_BOOKKEEPER_ALREADY_REJECTED', 'This classification is already rejected.', false);
    }

    // Update status to rejected
    const { error: updateErr } = await this.supabase
      .from('ai_bookkeeping_classifications')
      .update({ classification_status: 'rejected' })
      .eq('id', input.classificationId)
      .eq('business_id', context.businessId);

    if (updateErr) {
      throw new AISafeError('AI_INTERNAL_ERROR', updateErr.message || 'Failed to update classification status.', true);
    }

    // Insert review audit
    const { data: review, error: reviewErr } = await this.supabase
      .from('ai_bookkeeping_reviews')
      .insert({
        business_id: context.businessId,
        classification_id: input.classificationId,
        reviewer_user_id: context.userId,
        review_action: 'rejected',
        ai_operation_kind: classification.operation_kind,
        final_operation_kind: 'REJECTED',
        review_notes: input.notes ? `[${input.reasonCode}] ${input.notes}` : `[${input.reasonCode}]`,
      })
      .select('id')
      .single();

    if (reviewErr || !review) {
      throw new AISafeError('AI_INTERNAL_ERROR', reviewErr?.message || 'Failed to record rejection review.', true);
    }

    return { success: true, reviewId: review.id };
  }

  async applySuggestion(
    input: ApplyBookkeepingInput,
    context: ReviewRequestContext
  ): Promise<BookkeepingApplicationResult> {
    // 1. Authorize reviewer and canonical operation
    this.verifyReviewRole(context.role);
    this.verifyOperationRole(context.role, input.finalOperationKind);

    // 2. Fetch classification
    const { data: classification, error: fetchErr } = await this.supabase
      .from('ai_bookkeeping_classifications')
      .select('*')
      .eq('id', input.classificationId)
      .eq('business_id', context.businessId)
      .maybeSingle();

    if (fetchErr || !classification) {
      throw new AISafeError('AI_BOOKKEEPER_REVIEW_NOT_FOUND', 'Bookkeeping suggestion not found.', false);
    }

    if (classification.classification_status === 'superseded') {
      throw new AISafeError(
        'AI_BOOKKEEPER_STALE_CLASSIFICATION',
        'This classification has been superseded by a newer analysis.',
        false
      );
    }
    if (classification.classification_status === 'rejected') {
      throw new AISafeError('AI_BOOKKEEPER_ALREADY_REJECTED', 'Cannot apply a rejected classification.', false);
    }

    // 3. Application Idempotency & Conflict Check
    const payloadFingerprint = this.computeFingerprint({
      finalOperationKind: input.finalOperationKind,
      payload: input.payload,
    });

    const { data: existingApp, error: appCheckErr } = await this.supabase
      .from('ai_bookkeeping_applications')
      .select('*')
      .eq('business_id', context.businessId)
      .eq('idempotency_key', input.idempotencyKey)
      .maybeSingle();

    if (existingApp) {
      if (existingApp.payload_fingerprint !== payloadFingerprint) {
        throw new AISafeError(
          'AI_BOOKKEEPER_APPLICATION_CONFLICT',
          'An application with this idempotency key already exists with different transaction details.',
          false
        );
      }
      return {
        applicationId: existingApp.id,
        classificationId: classification.id,
        canonicalTargetType: existingApp.canonical_target_type as any,
        canonicalTargetId: existingApp.canonical_target_id,
        receiptId: existingApp.stock_receipt_id,
        status: existingApp.status as any,
        appliedAt: existingApp.applied_at,
      };
    }

    // If classification already marked applied and no matching idempotency key, deny double-application
    if (classification.classification_status === 'applied') {
      const { data: priorApp } = await this.supabase
        .from('ai_bookkeeping_applications')
        .select('*')
        .eq('classification_id', classification.id)
        .eq('business_id', context.businessId)
        .eq('status', 'succeeded')
        .maybeSingle();

      if (priorApp) {
        return {
          applicationId: priorApp.id,
          classificationId: classification.id,
          canonicalTargetType: priorApp.canonical_target_type as any,
          canonicalTargetId: priorApp.canonical_target_id,
          receiptId: priorApp.stock_receipt_id,
          status: priorApp.status as any,
          appliedAt: priorApp.applied_at,
        };
      }
      throw new AISafeError('AI_BOOKKEEPER_ALREADY_APPLIED', 'This classification has already been applied.', false);
    }

    // 4. Resolve operation adapter
    const adapter = BOOKKEEPER_ADAPTERS[input.finalOperationKind];
    if (!adapter) {
      throw new AISafeError(
        'AI_BOOKKEEPER_INVALID_FINAL_OPERATION',
        `No operation adapter exists for "${input.finalOperationKind}".`,
        false
      );
    }

    // 5. Execute canonical operation (zero Gemini calls)
    const adapterResult = await adapter.apply(
      this.supabase,
      context.businessId,
      context.userId,
      input.payload,
      input.idempotencyKey
    );

    // 6. Record Review Audit
    const isCorrected = input.finalOperationKind !== classification.operation_kind;
    const { data: reviewRecord } = await this.supabase
      .from('ai_bookkeeping_reviews')
      .insert({
        business_id: context.businessId,
        classification_id: classification.id,
        reviewer_user_id: context.userId,
        review_action: isCorrected ? 'corrected' : 'confirmed',
        ai_operation_kind: classification.operation_kind,
        final_operation_kind: input.finalOperationKind,
        category_correction_state: 'accepted',
        counterparty_correction_state: 'accepted',
        duplicate_warning_state: 'none',
        review_notes: input.reviewNotes || null,
      })
      .select('id')
      .maybeSingle();

    // 7. Record Application Link
    const { data: appRecord, error: appInsertErr } = await this.supabase
      .from('ai_bookkeeping_applications')
      .insert({
        business_id: context.businessId,
        classification_id: classification.id,
        review_id: reviewRecord?.id || null,
        application_kind: input.finalOperationKind,
        canonical_target_type: adapterResult.canonicalTargetType,
        canonical_target_id: adapterResult.canonicalTargetId,
        expense_id: adapterResult.expenseId || null,
        stock_receipt_id: adapterResult.stockReceiptId || null,
        sale_id: adapterResult.saleId || null,
        sale_payment_id: adapterResult.salePaymentId || null,
        expense_payment_id: adapterResult.expensePaymentId || null,
        stock_receipt_payment_id: adapterResult.stockReceiptPaymentId || null,
        sale_refund_id: adapterResult.saleRefundId || null,
        applied_by_user_id: context.userId,
        idempotency_key: input.idempotencyKey,
        payload_fingerprint: payloadFingerprint,
        status: 'succeeded',
      })
      .select('*')
      .single();

    if (appInsertErr || !appRecord) {
      throw new AISafeError('AI_INTERNAL_ERROR', appInsertErr?.message || 'Failed to record application link.', true);
    }

    // 8. Update classification status to 'applied'
    await this.supabase
      .from('ai_bookkeeping_classifications')
      .update({ classification_status: 'applied' })
      .eq('id', classification.id)
      .eq('business_id', context.businessId);

    return {
      applicationId: appRecord.id,
      classificationId: classification.id,
      canonicalTargetType: appRecord.canonical_target_type as any,
      canonicalTargetId: appRecord.canonical_target_id,
      canonicalTargetReference: adapterResult.canonicalTargetReference,
      receiptId: appRecord.stock_receipt_id,
      status: 'succeeded',
      appliedAt: appRecord.applied_at,
    };
  }
}
