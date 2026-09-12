import { z } from 'zod';
import type {
  AIFeatureKey,
  AIInvocationStatus,
  AIErrorCode,
  BookkeepingOperationKind,
  BookkeepingTransactionDirection,
  BookkeepingConfidenceBand,
  BookkeepingMissingField,
  BookkeepingWarningCode,
  StructuredBusinessSummaryResponse,
  AskNnooConversationStatus,
  AskNnooMessageRole,
  AskNnooResponseType,
  AskNnooSegmentType,
  AskNnooSourceKey,
  AskNnooActionKey,
  AskNnooToolKey,
  StructuredAskNnooResponse,
  SendAskNnooMessageInput,
  BusinessHealthScoreStatus,
  BusinessHealthScoreBand,
  BusinessHealthDimensionKey,
  BusinessHealthDimensionStatus,
  BusinessHealthDataCoverage,
  BusinessHealthReasonKey,
  BusinessHealthActionKey,
  BusinessHealthExplanation,
  BusinessHealthScoreResult,
  BusinessHealthScoreSnapshot,
  RefreshBusinessHealthScoreInput,
  ExplainBusinessHealthScoreInput,
  CreditPassportStatus,
  CreditPassportDataCoverage,
  CreditPassportProvenanceType,
  CreditPassportHighlightKey,
  CreditPassportAttentionKey,
  CreditPassportBusinessIdentity,
  CreditPassportRecordedHistory,
  CreditPassportFinancialPerformance,
  CreditPassportCurrentPosition,
  CreditPassportInvoiceActivity,
  CreditPassportInventoryPosition,
  CreditPassportHealthSummary,
  CreditPassportDataCoverageSection,
  CreditPassportExplanation,
  CreditPassportPayload,
  CreditPassportSnapshot,
  CreditPassportPreview,
  GenerateCreditPassportInput,
  CreateCreditPassportShareInput,
  CreditPassportShare,
  CreditPassportExternalProjection,
  CreditPassportVerificationResult,
  ExplainCreditPassportInput,
  AutomationType,
  AutomationFrequency,
  AutomationRunStatus,
  AutomationJobType,
  AutomationResultType,
  AutomationSkipReason,
  BusinessAttentionType,
  BusinessAttentionCategory,
  BusinessAttentionSeverity,
  BusinessAttentionStatus,
  BusinessAutomation,
  IntelligenceJobRun,
  BusinessAttentionEvent,
  UpdateAutomationInput,
  RunAutomationNowInput,
  RunAutomationNowResult,
  BusinessNotification,
  NotificationPreference,
  BusinessAttentionItem,
  BusinessAttentionSummary,
  NotificationFeedResponse,
  UnreadNotificationCountResponse,
  UpdateNotificationPreferenceInput,
  MarkNotificationReadInput,
  MarkAllNotificationsReadInput,
  NotificationCategory,
  NotificationType,
  NotificationChannel,
  NotificationActionKey,
} from '@nnoo/contracts';

export const AIFeatureKeySchema = z.enum([
  'ai.foundation.smoke',
  'ai.bookkeeper.classify',
  'ai.bookkeeper.explain',
  'ai.summary.business',
  'ai.ask_nnoo',
  'ai.health.explain',
  'ai.credit_passport.explain',
]) satisfies z.ZodType<AIFeatureKey>;

export const AIInvocationStatusSchema = z.enum([
  'pending',
  'succeeded',
  'failed',
  'blocked',
  'timeout',
  'rate_limited',
]) satisfies z.ZodType<AIInvocationStatus>;

export const AIErrorCodeSchema = z.enum([
  'AI_CONFIGURATION_UNAVAILABLE',
  'AI_FEATURE_DISABLED',
  'AI_FORBIDDEN',
  'AI_BUSINESS_RESTRICTED',
  'AI_INVALID_INPUT',
  'AI_CONTEXT_TOO_LARGE',
  'AI_RATE_LIMITED',
  'AI_PROVIDER_RATE_LIMITED',
  'AI_PROVIDER_UNAVAILABLE',
  'AI_PROVIDER_TIMEOUT',
  'AI_MODEL_UNAVAILABLE',
  'AI_RESPONSE_INVALID',
  'AI_RESPONSE_BLOCKED',
  'AI_TOOL_NOT_ALLOWED',
  'AI_TOOL_INPUT_INVALID',
  'AI_TOOL_FORBIDDEN',
  'AI_INTERNAL_ERROR',
  'AI_BOOKKEEPER_INVALID_INPUT',
  'AI_BOOKKEEPER_FORBIDDEN',
  'AI_BOOKKEEPER_CLASSIFICATION_FAILED',
  'AI_BOOKKEEPER_INVALID_RESULT',
  'AI_BOOKKEEPER_CANDIDATE_STALE',
  'AI_BOOKKEEPER_IDEMPOTENCY_CONFLICT',
  'AI_BOOKKEEPER_SOURCE_NOT_FOUND',
  'AI_BOOKKEEPER_BUSINESS_RESTRICTED',
  'AI_BOOKKEEPER_REVIEW_NOT_FOUND',
  'AI_BOOKKEEPER_REVIEW_FORBIDDEN',
  'AI_BOOKKEEPER_ALREADY_APPLIED',
  'AI_BOOKKEEPER_ALREADY_REJECTED',
  'AI_BOOKKEEPER_STALE_CLASSIFICATION',
  'AI_BOOKKEEPER_INVALID_FINAL_OPERATION',
  'AI_BOOKKEEPER_MISSING_REQUIRED_DATA',
  'AI_BOOKKEEPER_APPLICATION_FAILED',
  'AI_BOOKKEEPER_APPLICATION_CONFLICT',
  'AI_BOOKKEEPER_TARGET_NOT_FOUND',
  'AI_BOOKKEEPER_TARGET_ALREADY_SETTLED',
  'AI_BOOKKEEPER_RECLASSIFICATION_REQUIRED',
  'AI_INSIGHTS_FORBIDDEN',
  'AI_INSIGHTS_INVALID_PERIOD',
  'AI_INSIGHTS_INSUFFICIENT_DATA',
  'AI_INSIGHTS_FACT_BUILD_FAILED',
  'AI_INSIGHTS_GENERATION_FAILED',
  'AI_INSIGHTS_INVALID_RESULT',
  'AI_INSIGHTS_STALE',
  'AI_INSIGHTS_NOT_FOUND',
  'AI_INSIGHTS_IDEMPOTENCY_CONFLICT',
  'AI_INSIGHTS_BUSINESS_RESTRICTED',
  'ASK_NNOO_FORBIDDEN',
  'ASK_NNOO_INVALID_MESSAGE',
  'ASK_NNOO_CONVERSATION_NOT_FOUND',
  'ASK_NNOO_CONVERSATION_FORBIDDEN',
  'ASK_NNOO_TOOL_NOT_ALLOWED',
  'ASK_NNOO_TOOL_INPUT_INVALID',
  'ASK_NNOO_DATA_UNAVAILABLE',
  'ASK_NNOO_NEEDS_CLARIFICATION',
  'ASK_NNOO_INVALID_RESPONSE',
  'ASK_NNOO_IDEMPOTENCY_CONFLICT',
  'ASK_NNOO_RATE_LIMITED',
  'ASK_NNOO_BUSINESS_RESTRICTED',
  'BUSINESS_HEALTH_FORBIDDEN',
  'BUSINESS_HEALTH_INSUFFICIENT_DATA',
  'BUSINESS_HEALTH_CALCULATION_FAILED',
  'BUSINESS_HEALTH_FORMULA_INVALID',
  'BUSINESS_HEALTH_SNAPSHOT_NOT_FOUND',
  'BUSINESS_HEALTH_BUSINESS_RESTRICTED',
  'BUSINESS_HEALTH_IDEMPOTENCY_CONFLICT',
  'BUSINESS_HEALTH_EXPLANATION_FAILED',
  'BUSINESS_HEALTH_EXPLANATION_INVALID',
  'CREDIT_PASSPORT_FORBIDDEN',
  'CREDIT_PASSPORT_INSUFFICIENT_DATA',
  'CREDIT_PASSPORT_GENERATION_FAILED',
  'CREDIT_PASSPORT_NOT_FOUND',
  'CREDIT_PASSPORT_BUSINESS_RESTRICTED',
  'AI_CREDIT_PASSPORT_IDEMPOTENCY_CONFLICT',
  'CREDIT_PASSPORT_SHARE_FORBIDDEN',
  'CREDIT_PASSPORT_SHARE_NOT_FOUND',
  'CREDIT_PASSPORT_SHARE_EXPIRED',
  'CREDIT_PASSPORT_SHARE_REVOKED',
  'CREDIT_PASSPORT_VERIFICATION_FAILED',
  'CREDIT_PASSPORT_PDF_FAILED',
  'CREDIT_PASSPORT_EXPLANATION_FAILED',
  'CREDIT_PASSPORT_EXPLANATION_INVALID',
  'WHATSAPP_UNAUTHENTICATED',
  'WHATSAPP_FORBIDDEN',
  'WHATSAPP_NOT_CONFIGURED',
  'WHATSAPP_INVALID_SIGNATURE',
  'WHATSAPP_INVALID_VERIFY_TOKEN',
  'WHATSAPP_LINK_EXPIRED',
  'WHATSAPP_LINK_INVALID',
  'WHATSAPP_LINK_RATE_LIMITED',
  'WHATSAPP_ALREADY_CONNECTED',
  'WHATSAPP_CONNECTION_NOT_FOUND',
  'WHATSAPP_PROVIDER_ERROR',
  'WHATSAPP_DELIVERY_FAILED',
  'WHATSAPP_OPTED_OUT',
  'WHATSAPP_MUTATION_NOT_PERMITTED',
  'WHATSAPP_BUSINESS_SWITCH_INVALID',
  'ADMIN_UNAUTHENTICATED',
  'ADMIN_FORBIDDEN',
  'ADMIN_INVALID_FILTER',
  'ADMIN_FEATURE_CONTROL_INVALID',
  'ADMIN_REASON_REQUIRED',
  'ADMIN_JOB_NOT_FOUND',
  'ADMIN_JOB_NOT_RETRYABLE',
  'ADMIN_JOB_RETRY_FAILED',
  'ADMIN_DELIVERY_NOT_FOUND',
  'ADMIN_DELIVERY_NOT_RETRYABLE',
  'ADMIN_DELIVERY_RETRY_BLOCKED',
  'ADMIN_INTERNAL_ERROR',
  'PUSH_UNAUTHENTICATED',
  'PUSH_FORBIDDEN',
  'PUSH_DEVICE_INVALID',
  'PUSH_TOKEN_INVALID',
  'PUSH_DEVICE_NOT_FOUND',
  'PUSH_DELIVERY_FAILED',
  'PUSH_DELIVERY_BLOCKED',
  'PUSH_PREFERENCE_MUTED',
  'PUSH_RECIPIENT_INELIGIBLE',
  'PUSH_BUSINESS_SUSPENDED',
]) satisfies z.ZodType<AIErrorCode>;


export const AIUsageMetadataSchema = z.object({
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
});

export const AISafeErrorSchema = z.object({
  code: AIErrorCodeSchema,
  message: z.string().min(1),
  retryable: z.boolean(),
  details: z.record(z.unknown()).optional(),
});

export const FoundationSmokeResponseSchema = z.object({
  status: z.literal('ok'),
  message: z.string().min(1),
  echoFact: z.string().optional(),
  timestamp: z.string(),
});

export const VerifiedFactEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    schemaVersion: z.string().min(1),
    businessId: z.string().uuid().optional(),
    generatedAt: z.string().datetime(),
    source: z.string().min(1),
    data: dataSchema,
  });

export const AIInvocationRecordSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid().nullable(),
  user_id: z.string().uuid().nullable(),
  feature_key: AIFeatureKeySchema,
  prompt_version: z.string().min(1),
  response_schema_version: z.string().min(1),
  model_id: z.string().min(1),
  status: AIInvocationStatusSchema,
  provider_request_id: z.string().nullable(),
  input_tokens: z.number().int().nonnegative().nullable(),
  output_tokens: z.number().int().nonnegative().nullable(),
  total_tokens: z.number().int().nonnegative().nullable(),
  latency_ms: z.number().int().nonnegative().nullable(),
  error_code: AIErrorCodeSchema.nullable(),
  request_fingerprint: z.string().nullable(),
  created_at: z.string(),
  completed_at: z.string().nullable(),
});

// ============================================================================
// TRANCHE 3 PROMPT 2: AI BOOKKEEPER TAXONOMY & CLASSIFICATION SCHEMAS
// ============================================================================

export const BookkeepingOperationKindSchema = z.enum([
  'OPERATING_EXPENSE',
  'STOCK_PURCHASE',
  'CUSTOMER_PAYMENT',
  'SUPPLIER_PAYMENT',
  'SALE',
  'REFUND',
  'UNKNOWN',
  'UNSUPPORTED',
]) satisfies z.ZodType<BookkeepingOperationKind>;

export const BookkeepingTransactionDirectionSchema = z.enum([
  'MONEY_IN',
  'MONEY_OUT',
  'UNKNOWN',
]) satisfies z.ZodType<BookkeepingTransactionDirection>;

export const BookkeepingConfidenceBandSchema = z.enum([
  'HIGH',
  'MEDIUM',
  'LOW',
]) satisfies z.ZodType<BookkeepingConfidenceBand>;

export const BookkeepingMissingFieldSchema = z.enum([
  'AMOUNT_REQUIRED',
  'CUSTOMER_REQUIRED',
  'SUPPLIER_REQUIRED',
  'PAYABLE_SELECTION_REQUIRED',
  'SALE_SELECTION_REQUIRED',
  'PRODUCT_LINES_REQUIRED',
  'PAYMENT_METHOD_REQUIRED',
  'REFERENCE_RECOMMENDED',
  'CATEGORY_REVIEW_REQUIRED',
]) satisfies z.ZodType<BookkeepingMissingField>;

export const BookkeepingWarningCodeSchema = z.enum([
  'AMBIGUOUS_DESCRIPTION',
  'POSSIBLE_DUPLICATE',
  'COUNTERPARTY_NOT_MATCHED',
  'MULTIPLE_COUNTERPARTY_MATCHES',
  'UNSUPPORTED_OPERATION',
  'DIRECTION_CONFLICT',
  'CATEGORY_NOT_CONFIDENT',
  'INSUFFICIENT_INFORMATION',
]) satisfies z.ZodType<BookkeepingWarningCode>;

export const BookkeepingCategoryCandidateSchema = z.object({
  candidateKey: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  systemKey: z.string().nullable().optional(),
});

export const BookkeepingSupplierCandidateSchema = z.object({
  candidateKey: z.string().min(1).max(50),
  displayName: z.string().min(1).max(150),
});

export const BookkeepingCustomerCandidateSchema = z.object({
  candidateKey: z.string().min(1).max(50),
  displayName: z.string().min(1).max(150),
});

export const BookkeepingDuplicateCandidateSchema = z.object({
  candidateKey: z.string().min(1).max(50),
  occurredAt: z.string(),
  amountMinor: z.number().int(),
  reference: z.string().nullable().optional(),
  operationType: z.string().min(1),
  counterpartyName: z.string().nullable().optional(),
});

export const BookkeepingClassificationInputSchema = z.object({
  businessId: z.string().uuid().optional(),
  description: z
    .string()
    .trim()
    .min(1, 'Bookkeeping description cannot be empty')
    .max(1000, 'Description must not exceed 1,000 characters'),
  amountMinor: z.number().int().nonnegative().nullable().optional(),
  currencyCode: z.string().length(3).optional(),
  transactionDirection: BookkeepingTransactionDirectionSchema.nullable().optional(),
  transactionDate: z.string().date().nullable().optional(),
  paymentMethod: z.string().max(50).nullable().optional(),
  reference: z.string().max(100).nullable().optional(),
  counterpartyText: z.string().max(150).nullable().optional(),
  idempotencyKey: z.string().max(100).nullable().optional(),
  sourceKind: z.string().max(50).optional(),
  sourceRecordType: z.string().max(50).nullable().optional(),
  sourceRecordId: z.string().uuid().nullable().optional(),
});

/**
 * Validates the raw JSON schema response from the Gemini provider.
 * Gemini can only choose from candidate keys provided in the prompt.
 */
export const BookkeepingStructuredOutputSchema = z.object({
  schemaVersion: z.string().optional().default('1.0.0'),
  operationKind: BookkeepingOperationKindSchema,
  confidenceBand: BookkeepingConfidenceBandSchema,
  categoryCandidateKey: z.string().max(50).nullable().optional(),
  supplierCandidateKey: z.string().max(50).nullable().optional(),
  customerCandidateKey: z.string().max(50).nullable().optional(),
  possibleDuplicateCandidateKeys: z.array(z.string().max(50)).max(10).optional().default([]),
  missingFields: z.array(BookkeepingMissingFieldSchema).max(10).optional().default([]),
  warningCodes: z.array(BookkeepingWarningCodeSchema).max(10).optional().default([]),
  shortExplanation: z.string().min(1).max(500),
});

export const BookkeepingClassificationStatusSchema = z.enum([
  'pending_review',
  'applied',
  'rejected',
  'superseded',
  'analysis_failed',
]);

export const BookkeepingReviewActionSchema = z.enum([
  'confirmed',
  'corrected',
  'rejected',
  'reclassified',
]);

export const BookkeepingFinalOperationKindSchema = z.enum([
  'OPERATING_EXPENSE',
  'STOCK_PURCHASE',
  'CUSTOMER_PAYMENT',
  'SUPPLIER_PAYMENT',
  'SALE',
  'REFUND',
]);

export const BookkeepingApplicationStatusSchema = z.enum([
  'pending',
  'succeeded',
  'failed',
]);

export const BookkeepingApplicationTargetTypeSchema = z.enum([
  'EXPENSE',
  'STOCK_RECEIPT',
  'SALE_PAYMENT',
  'EXPENSE_PAYMENT',
  'STOCK_RECEIPT_PAYMENT',
  'SALE',
  'SALE_REFUND',
]);

export const BookkeepingCorrectionStateSchema = z.enum([
  'accepted',
  'corrected',
  'cleared',
  'not_applicable',
]);

export const BookkeepingDuplicateWarningStateSchema = z.enum([
  'none',
  'acknowledged',
  'confirmed_duplicate',
  'not_duplicate',
]);

export const BookkeepingRejectionReasonSchema = z.enum([
  'NOT_A_BUSINESS_TRANSACTION',
  'DUPLICATE',
  'INCORRECT_SUGGESTION',
  'NO_LONGER_NEEDED',
  'TEST_OR_ERROR',
  'OTHER',
]);

export const BookkeepingClassificationResultSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  requestedByUserId: z.string().uuid(),
  description: z.string(),
  amountMinor: z.number().int().nullable().optional(),
  currencyCode: z.string().length(3),
  transactionDirection: BookkeepingTransactionDirectionSchema.nullable().optional(),
  transactionDate: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  referenceText: z.string().nullable().optional(),
  counterpartyText: z.string().nullable().optional(),
  inputFingerprint: z.string().length(64),
  idempotencyKey: z.string().nullable().optional(),
  operationKind: BookkeepingOperationKindSchema,
  confidenceBand: BookkeepingConfidenceBandSchema,
  categorySuggestion: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  supplierSuggestion: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  customerSuggestion: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  possibleDuplicateIds: z.array(z.string().uuid()).optional().default([]),
  missingFields: z.array(BookkeepingMissingFieldSchema).default([]),
  warningCodes: z.array(BookkeepingWarningCodeSchema).default([]),
  shortExplanation: z.string(),
  requiresHumanReview: z.literal(true),
  promptVersion: z.string(),
  responseSchemaVersion: z.string(),
  modelId: z.string(),
  aiInvocationId: z.string().uuid().nullable().optional(),
  classificationStatus: BookkeepingClassificationStatusSchema,
  createdAt: z.string(),
  supersededAt: z.string().nullable().optional(),
});

export const ReclassifyBookkeepingInputSchema = z.object({
  classificationId: z.string().uuid(),
  modifiedDescription: z.string().trim().min(1).max(1000).optional(),
  modifiedAmountMinor: z.number().int().nonnegative().nullable().optional(),
  modifiedDirection: BookkeepingTransactionDirectionSchema.nullable().optional(),
  modifiedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').nullable().optional(),
  modifiedPaymentMethod: z.string().max(50).nullable().optional(),
  modifiedReference: z.string().max(100).nullable().optional(),
  modifiedCounterparty: z.string().max(200).nullable().optional(),
  idempotencyKey: z.string().max(100).nullable().optional(),
});

export const RejectBookkeepingInputSchema = z.object({
  classificationId: z.string().uuid(),
  reasonCode: BookkeepingRejectionReasonSchema,
  notes: z.string().max(500).nullable().optional(),
});

export const CorrectBookkeepingInputSchema = z.object({
  classificationId: z.string().uuid(),
  correctedOperationKind: BookkeepingFinalOperationKindSchema,
  correctedCategoryId: z.string().uuid().nullable().optional(),
  correctedSupplierId: z.string().uuid().nullable().optional(),
  correctedCustomerId: z.string().uuid().nullable().optional(),
  duplicateWarningAcknowledged: z.boolean().optional(),
  reviewNotes: z.string().max(500).nullable().optional(),
});

export const ExpenseApplyPayloadSchema = z.object({
  amountMinor: z.number().int().positive(),
  expenseCategoryId: z.string().uuid(),
  description: z.string().trim().min(1).max(255),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  supplierId: z.string().uuid().nullable().optional(),
  payment: z
    .object({
      amountMinor: z.number().int().positive(),
      paymentMethod: z.string().min(1).max(50),
      reference: z.string().max(100).nullable().optional(),
      notes: z.string().max(500).nullable().optional(),
    })
    .nullable()
    .optional(),
  notes: z.string().max(1000).nullable().optional(),
  receiptUrl: z.string().url().nullable().optional(),
});

export const StockPurchaseApplyPayloadSchema = z.object({
  supplierId: z.string().uuid(),
  receivedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  supplierInvoiceNumber: z.string().max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  items: z
    .array(
      z.object({
        catalogItemId: z.string().uuid(),
        quantity: z.number().positive(),
        unitCostMinor: z.number().int().positive(),
        batchNumber: z.string().max(50).nullable().optional(),
        expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
      })
    )
    .min(1, 'At least one item line is required for stock purchase'),
  payment: z
    .object({
      amountMinor: z.number().int().positive(),
      paymentMethod: z.string().min(1).max(50),
      reference: z.string().max(100).nullable().optional(),
      notes: z.string().max(500).nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const CustomerPaymentApplyPayloadSchema = z.object({
  saleId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  paymentMethod: z.string().min(1).max(50),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  reference: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const SupplierPaymentApplyPayloadSchema = z.object({
  payableSourceType: z.enum(['EXPENSE', 'STOCK_RECEIPT']),
  payableId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  paymentMethod: z.string().min(1).max(50),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  reference: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const SaleApplyPayloadSchema = z.object({
  customerId: z.string().uuid().nullable().optional(),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  orderReference: z.string().max(100).nullable().optional(),
  customerNotes: z.string().max(500).nullable().optional(),
  staffNotes: z.string().max(500).nullable().optional(),
  items: z
    .array(
      z.object({
        catalogItemId: z.string().uuid(),
        quantity: z.number().positive(),
        unitPriceMinor: z.number().int().positive().optional(),
        discountMinor: z.number().int().nonnegative().optional(),
        notes: z.string().max(255).nullable().optional(),
      })
    )
    .min(1, 'At least one sale item is required'),
  payments: z
    .array(
      z.object({
        amountMinor: z.number().int().positive(),
        paymentMethod: z.string().min(1).max(50),
        reference: z.string().max(100).nullable().optional(),
        notes: z.string().max(500).nullable().optional(),
      })
    )
    .default([]),
});

export const RefundApplyPayloadSchema = z.object({
  saleId: z.string().uuid(),
  reason: z.string().trim().min(1).max(255),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  items: z
    .array(
      z.object({
        saleItemId: z.string().uuid(),
        quantity: z.number().positive(),
        restock: z.boolean(),
      })
    )
    .min(1, 'At least one item must be selected for refund'),
  payments: z
    .array(
      z.object({
        amountMinor: z.number().int().positive(),
        paymentMethod: z.string().min(1).max(50),
        reference: z.string().max(100).nullable().optional(),
        notes: z.string().max(500).nullable().optional(),
      })
    )
    .min(1, 'At least one refund payment method is required'),
});

export const ApplyBookkeepingInputSchema = z.discriminatedUnion('finalOperationKind', [
  z.object({
    classificationId: z.string().uuid(),
    finalOperationKind: z.literal('OPERATING_EXPENSE'),
    payload: ExpenseApplyPayloadSchema,
    reviewNotes: z.string().max(500).nullable().optional(),
    idempotencyKey: z.string().min(1).max(100),
  }),
  z.object({
    classificationId: z.string().uuid(),
    finalOperationKind: z.literal('STOCK_PURCHASE'),
    payload: StockPurchaseApplyPayloadSchema,
    reviewNotes: z.string().max(500).nullable().optional(),
    idempotencyKey: z.string().min(1).max(100),
  }),
  z.object({
    classificationId: z.string().uuid(),
    finalOperationKind: z.literal('CUSTOMER_PAYMENT'),
    payload: CustomerPaymentApplyPayloadSchema,
    reviewNotes: z.string().max(500).nullable().optional(),
    idempotencyKey: z.string().min(1).max(100),
  }),
  z.object({
    classificationId: z.string().uuid(),
    finalOperationKind: z.literal('SUPPLIER_PAYMENT'),
    payload: SupplierPaymentApplyPayloadSchema,
    reviewNotes: z.string().max(500).nullable().optional(),
    idempotencyKey: z.string().min(1).max(100),
  }),
  z.object({
    classificationId: z.string().uuid(),
    finalOperationKind: z.literal('SALE'),
    payload: SaleApplyPayloadSchema,
    reviewNotes: z.string().max(500).nullable().optional(),
    idempotencyKey: z.string().min(1).max(100),
  }),
  z.object({
    classificationId: z.string().uuid(),
    finalOperationKind: z.literal('REFUND'),
    payload: RefundApplyPayloadSchema,
    reviewNotes: z.string().max(500).nullable().optional(),
    idempotencyKey: z.string().min(1).max(100),
  }),
]);

// ==============================================================================
// TRANCHE 3 — PROMPT 4: VERIFIED BUSINESS SUMMARIES & SMART INSIGHTS SCHEMAS
// ==============================================================================

export const BusinessSummaryTypeSchema = z.enum([
  'today',
  'this_week',
  'this_month',
  'custom',
]);

export const BusinessSummaryStatusSchema = z.enum([
  'ready',
  'failed',
  'superseded',
]);

export const BusinessSummaryPeriodSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  timezone: z.string().min(1),
  label: z.string().min(1),
});

export const BusinessSummaryPeriodComparisonSchema = z.object({
  current: BusinessSummaryPeriodSchema,
  previous: BusinessSummaryPeriodSchema.optional(),
  isComparable: z.boolean(),
  reason: z.string().optional(),
});

export const VerifiedPerformanceFactsSchema = z.object({
  grossSalesMinor: z.number().int().nonnegative(),
  salesCount: z.number().int().nonnegative(),
  refundsMinor: z.number().int().nonnegative(),
  netSalesMinor: z.number().int(),
  customerPaymentsReceivedMinor: z.number().int().nonnegative(),
  cogsMinor: z.number().int().nonnegative(),
  grossProfitMinor: z.number().int(),
  operatingExpensesMinor: z.number().int().nonnegative(),
  inventoryAdjustmentGainMinor: z.number().int().nonnegative(),
  inventoryShrinkageLossMinor: z.number().int().nonnegative(),
  operatingResultMinor: z.number().int(),
});

export const VerifiedCurrentPositionFactsSchema = z.object({
  accountsReceivableMinor: z.number().int().nonnegative(),
  accountsPayableMinor: z.number().int().nonnegative(),
  inventoryValueMinor: z.number().int().nonnegative(),
  lowStockCount: z.number().int().nonnegative(),
  outOfStockCount: z.number().int().nonnegative(),
  overdueInvoicesCount: z.number().int().nonnegative(),
  asOfTimestamp: z.string().datetime({ offset: true }),
});

export const VerifiedFactBundleSchema = z.object({
  schemaVersion: z.string().min(1),
  businessId: z.string().uuid(),
  currencyCode: z.string().length(3),
  timezone: z.string().min(1),
  summaryType: BusinessSummaryTypeSchema,
  period: BusinessSummaryPeriodSchema,
  comparison: BusinessSummaryPeriodComparisonSchema.optional(),
  performance: VerifiedPerformanceFactsSchema,
  previousPerformance: VerifiedPerformanceFactsSchema.nullable().optional(),
  currentPosition: VerifiedCurrentPositionFactsSchema,
  permittedFactKeys: z.array(z.string()),
  generatedAt: z.string().datetime({ offset: true }),
  hasSufficientData: z.boolean(),
});

export const BusinessInsightSignalTypeSchema = z.enum([
  'performance',
  'position',
  'attention',
]);

export const BusinessInsightSignalDirectionSchema = z.enum([
  'UP',
  'DOWN',
  'UNCHANGED',
  'NOT_COMPARABLE',
]);

export const BusinessInsightSignalKeySchema = z.enum([
  'NET_SALES_CHANGE',
  'REFUNDS_PRESENT',
  'COGS_CHANGE',
  'GROSS_PROFIT_CHANGE',
  'OPERATING_EXPENSE_CHANGE',
  'OPERATING_RESULT_CHANGE',
  'OUTSTANDING_RECEIVABLES',
  'OUTSTANDING_PAYABLES',
  'LOW_STOCK_PRESENT',
  'OUT_OF_STOCK_PRESENT',
  'OVERDUE_INVOICES_PRESENT',
  'INVENTORY_POSITION',
]);

export const BusinessInsightActionKeySchema = z.enum([
  'OPEN_SALES_REPORT',
  'OPEN_EXPENSE_REPORT',
  'OPEN_PROFITABILITY_REPORT',
  'OPEN_RECEIVABLES',
  'OPEN_PAYABLES',
  'OPEN_INVENTORY',
  'OPEN_LOW_STOCK',
  'OPEN_OVERDUE_INVOICES',
]);

export const BusinessInsightSignalSchema = z.object({
  signalKey: BusinessInsightSignalKeySchema,
  type: BusinessInsightSignalTypeSchema,
  direction: BusinessInsightSignalDirectionSchema,
  title: z.string().min(1).max(200),
  formattedMetric: z.string().min(1).max(100),
  changeDescription: z.string().max(200).optional(),
  sourceProvenance: z.string().min(1).max(100),
  actionKey: BusinessInsightActionKeySchema.optional(),
});

export const StructuredBusinessSummaryResponseSchema = z.object({
  schemaVersion: z.string().min(1),
  headline: z.string().min(1).max(200),
  overview: z.string().min(1).max(1500),
  highlightSignalKeys: z.array(BusinessInsightSignalKeySchema).max(5),
  attentionSignalKeys: z.array(BusinessInsightSignalKeySchema).max(5),
  actionKeys: z.array(BusinessInsightActionKeySchema).max(5),
}) satisfies z.ZodType<StructuredBusinessSummaryResponse>;

export const GenerateBusinessSummaryInputSchema = z.object({
  summaryType: BusinessSummaryTypeSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  idempotencyKey: z.string().min(1).max(100),
});

// ============================================================================
// ASK NNOO PRODUCTION ASSISTANT VALIDATION SCHEMAS (T3-P05)
// ============================================================================

export const AskNnooConversationStatusSchema = z.enum([
  'active',
  'archived',
]) satisfies z.ZodType<AskNnooConversationStatus>;

export const AskNnooMessageRoleSchema = z.enum([
  'user',
  'assistant',
]) satisfies z.ZodType<AskNnooMessageRole>;

export const AskNnooResponseTypeSchema = z.enum([
  'ANSWER',
  'LIST',
  'COMPARISON',
  'EXPLANATION',
  'INSUFFICIENT_DATA',
  'FORBIDDEN',
  'UNSUPPORTED_REQUEST',
  'MUTATION_REQUIRES_WORKFLOW',
  'NEEDS_CLARIFICATION',
]) satisfies z.ZodType<AskNnooResponseType>;

export const AskNnooSegmentTypeSchema = z.enum([
  'TEXT',
  'FACT',
  'SAFE_ENTITY_LABEL',
]) satisfies z.ZodType<AskNnooSegmentType>;

export const AskNnooResponseSegmentSchema = z.object({
  type: AskNnooSegmentTypeSchema,
  text: z.string().max(2000).nullish(),
  factKey: z.string().max(100).nullish(),
  formattedValue: z.string().max(100).nullish(),
  label: z.string().max(200).nullish(),
  entityKey: z.string().max(100).nullish(),
});

export const AskNnooSourceKeySchema = z.enum([
  'SALES_REPORT',
  'EXPENSE_REPORT',
  'PROFITABILITY_REPORT',
  'RECEIVABLES',
  'PAYABLES',
  'INVENTORY',
  'INVOICES',
  'BOOKKEEPER',
  'BUSINESS_OVERVIEW',
]) satisfies z.ZodType<AskNnooSourceKey>;

export const AskNnooActionKeySchema = z.enum([
  'OPEN_SALES_REPORT',
  'OPEN_EXPENSE_REPORT',
  'OPEN_PROFITABILITY_REPORT',
  'OPEN_RECEIVABLES',
  'OPEN_PAYABLES',
  'OPEN_INVENTORY',
  'OPEN_LOW_STOCK',
  'OPEN_INVOICES',
  'OPEN_OVERDUE_INVOICES',
  'OPEN_AI_BOOKKEEPER',
  'RECORD_EXPENSE',
  'CREATE_SALE',
]) satisfies z.ZodType<AskNnooActionKey>;

export const AskNnooToolKeySchema = z.enum([
  'getBusinessOverview',
  'getSalesSummary',
  'getProfitabilitySummary',
  'getExpenseSummary',
  'getReceivablesSummary',
  'getPayablesSummary',
  'getInventoryStatus',
  'getInvoiceStatus',
  'getBookkeeperStatus',
  'lookupCustomer',
  'lookupProduct',
]) satisfies z.ZodType<AskNnooToolKey>;

export const StructuredAskNnooResponseSchema = z.object({
  schemaVersion: z.string().min(1),
  responseType: AskNnooResponseTypeSchema,
  headline: z.string().max(200).nullish(),
  segments: z.array(AskNnooResponseSegmentSchema).max(50),
  factKeys: z.array(z.string().max(100)).max(30),
  entityKeys: z.array(z.string().max(100)).max(30),
  sourceKeys: z.array(AskNnooSourceKeySchema).max(10),
  actionKeys: z.array(AskNnooActionKeySchema).max(10),
  followUpQuestions: z.array(z.string().max(200)).max(5),
  requiredCapabilities: z.array(z.string().max(100)).max(20),
}) satisfies z.ZodType<StructuredAskNnooResponse>;

export const SendAskNnooMessageInputSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(4000, 'Message cannot exceed 4000 characters'),
  idempotencyKey: z.string().min(1).max(100),
}) satisfies z.ZodType<SendAskNnooMessageInput>;

// ==============================================================================
// BUSINESS HEALTH SCORE SCHEMAS (Prompt 6)
// ==============================================================================

export const BusinessHealthScoreStatusSchema = z.enum([
  'READY',
  'INSUFFICIENT_DATA',
]) satisfies z.ZodType<BusinessHealthScoreStatus>;

export const BusinessHealthScoreBandSchema = z.enum([
  'STRONG',
  'GOOD',
  'FAIR',
  'NEEDS_ATTENTION',
]) satisfies z.ZodType<BusinessHealthScoreBand>;

export const BusinessHealthDimensionKeySchema = z.enum([
  'SALES_PROFITABILITY',
  'OPERATING_EFFICIENCY',
  'RECEIVABLES_COLLECTION',
  'BUSINESS_OBLIGATIONS',
  'INVENTORY_READINESS',
]) satisfies z.ZodType<BusinessHealthDimensionKey>;

export const BusinessHealthDimensionStatusSchema = z.enum([
  'SUFFICIENT',
  'INSUFFICIENT_DATA',
  'NOT_APPLICABLE',
]) satisfies z.ZodType<BusinessHealthDimensionStatus>;

export const BusinessHealthDataCoverageSchema = z.enum([
  'HIGH',
  'MEDIUM',
  'LOW',
  'INSUFFICIENT',
]) satisfies z.ZodType<BusinessHealthDataCoverage>;

export const BusinessHealthReasonKeySchema = z.enum([
  'GROSS_PROFIT_STRONG',
  'GROSS_PROFIT_HEALTHY',
  'GROSS_PROFIT_LOW',
  'GROSS_PROFIT_NEGATIVE',
  'OPERATING_RESULT_POSITIVE',
  'OPERATING_RESULT_NEGATIVE',
  'SALES_VOLUME_ADEQUATE',
  'SALES_VOLUME_LOW',
  'EXPENSE_MANAGEMENT_EFFICIENT',
  'EXPENSE_PRESSURE_MODERATE',
  'EXPENSE_PRESSURE_ELEVATED',
  'EXPENSES_EXCEED_GROSS_PROFIT',
  'RECEIVABLES_MINIMAL',
  'RECEIVABLES_HEALTHY',
  'RECEIVABLES_ELEVATED',
  'OVERDUE_INVOICES_PRESENT',
  'NO_OVERDUE_INVOICES',
  'PAYABLES_CLEAN',
  'PAYABLES_MANAGEABLE',
  'PAYABLES_ELEVATED',
  'INVENTORY_OPTIMAL',
  'INVENTORY_STABLE',
  'LOW_STOCK_ALERT',
  'OUT_OF_STOCK_ALERT',
  'INVENTORY_NOT_APPLICABLE',
  'DATA_COVERAGE_COMPREHENSIVE',
  'DATA_COVERAGE_ESTABLISHED',
  'DATA_COVERAGE_EARLY',
  'DATA_COVERAGE_INSUFFICIENT',
]) satisfies z.ZodType<BusinessHealthReasonKey>;

export const BusinessHealthActionKeySchema = z.enum([
  'OPEN_SALES_REPORT',
  'OPEN_PROFITABILITY_REPORT',
  'OPEN_EXPENSE_REPORT',
  'OPEN_RECEIVABLES',
  'OPEN_PAYABLES',
  'OPEN_LOW_STOCK',
  'OPEN_INVENTORY',
  'OPEN_OVERDUE_INVOICES',
]) satisfies z.ZodType<BusinessHealthActionKey>;

export const StructuredHealthExplanationResponseSchema = z.object({
  schemaVersion: z.literal('1.0.0').default('1.0.0'),
  headline: z.string().min(1).max(200),
  overview: z.string().min(1).max(2000),
  strengthReasonKeys: z.array(BusinessHealthReasonKeySchema).default([]),
  attentionReasonKeys: z.array(BusinessHealthReasonKeySchema).default([]),
  actionKeys: z.array(BusinessHealthActionKeySchema).default([]),
});

export const RefreshBusinessHealthScoreInputSchema = z.object({
  idempotencyKey: z.string().min(8).max(128).optional(),
}) satisfies z.ZodType<RefreshBusinessHealthScoreInput>;

export const ExplainBusinessHealthScoreInputSchema = z.object({
  snapshotId: z.string().uuid().optional(),
}) satisfies z.ZodType<ExplainBusinessHealthScoreInput>;

// ============================================================================
// Credit Passport Validation Schemas (T3-P07)
// ============================================================================

export const CreditPassportStatusSchema = z.enum([
  'ready',
  'limited_history',
  'insufficient_data',
  'revoked',
]) satisfies z.ZodType<CreditPassportStatus>;

export const CreditPassportDataCoverageSchema = z.enum([
  'high',
  'medium',
  'low',
  'insufficient',
]) satisfies z.ZodType<CreditPassportDataCoverage>;

export const CreditPassportProvenanceTypeSchema = z.enum([
  'BUSINESS_PROFILE_PROVIDED',
  'NNOO_OPERATIONAL_RECORD',
  'NNOO_FINANCIAL_CALCULATION',
  'NNOO_HEALTH_SCORE',
  'EXTERNAL_VERIFICATION',
]) satisfies z.ZodType<CreditPassportProvenanceType>;

export const CreditPassportHighlightKeySchema = z.enum([
  'RECORDED_SALES_ACTIVITY',
  'POSITIVE_GROSS_PROFIT',
  'OPERATING_RESULT_POSITIVE',
  'RECEIVABLES_HEALTHY',
  'RECEIVABLES_PRESENT',
  'PAYABLES_CLEAN',
  'PAYABLES_PRESENT',
  'NO_OVERDUE_INVOICES',
  'OVERDUE_INVOICES_PRESENT',
  'INVENTORY_TRACKED',
  'INVENTORY_OPTIMAL',
  'LOW_STOCK_PRESENT',
  'HEALTH_SCORE_AVAILABLE',
  'LIMITED_RECORDED_HISTORY',
  'DATA_COVERAGE_HIGH',
  'DATA_COVERAGE_ESTABLISHED',
  'DATA_COVERAGE_EARLY',
  'DATA_COVERAGE_INSUFFICIENT',
]) satisfies z.ZodType<CreditPassportHighlightKey>;

export const CreditPassportAttentionKeySchema = z.enum([
  'EXPENSES_EXCEED_GROSS_PROFIT',
  'OVERDUE_INVOICES_ALERT',
  'ELEVATED_PAYABLES_ALERT',
  'OUT_OF_STOCK_ALERT',
  'LOW_STOCK_ALERT',
  'LIMITED_HISTORY_NOTICE',
  'INSUFFICIENT_DATA_NOTICE',
]) satisfies z.ZodType<CreditPassportAttentionKey>;

export const CreditPassportBusinessIdentitySchema = z.object({
  name: z.string().min(1),
  legalName: z.string().nullable(),
  industry: z.string(),
  countryCode: z.string(),
  currencyCode: z.string(),
  timezone: z.string(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  registrationNumber: z.string().nullable(),
  taxIdentifier: z.string().nullable(),
  businessCreatedAt: z.string(),
  provenance: CreditPassportProvenanceTypeSchema,
}) satisfies z.ZodType<CreditPassportBusinessIdentity>;

export const CreditPassportRecordedHistorySchema = z.object({
  firstRecordedDate: z.string().nullable(),
  lastRecordedDate: z.string().nullable(),
  recordedDaysCount: z.number().int().nonnegative(),
  provenance: CreditPassportProvenanceTypeSchema,
}) satisfies z.ZodType<CreditPassportRecordedHistory>;

export const CreditPassportFinancialPerformanceSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  netSalesMinor: z.number().int(),
  grossSalesMinor: z.number().int(),
  salesCount: z.number().int().nonnegative(),
  refundsCount: z.number().int().nonnegative(),
  refundsTotalMinor: z.number().int().nonnegative(),
  grossProfitMinor: z.number().int(),
  operatingExpensesMinor: z.number().int().nonnegative(),
  operatingResultMinor: z.number().int(),
  provenance: CreditPassportProvenanceTypeSchema,
}) satisfies z.ZodType<CreditPassportFinancialPerformance>;

export const CreditPassportCurrentPositionSchema = z.object({
  asOf: z.string(),
  accountsReceivableMinor: z.number().int(),
  accountsPayableMinor: z.number().int(),
  inventoryValueMinor: z.number().int().nullable(),
  overdueInvoicesCount: z.number().int().nonnegative(),
  overdueInvoicesAmountMinor: z.number().int().nonnegative(),
  provenance: CreditPassportProvenanceTypeSchema,
}) satisfies z.ZodType<CreditPassportCurrentPosition>;

export const CreditPassportInvoiceActivitySchema = z.object({
  totalInvoicesCount: z.number().int().nonnegative(),
  paidInvoicesCount: z.number().int().nonnegative(),
  pendingInvoicesCount: z.number().int().nonnegative(),
  overdueInvoicesCount: z.number().int().nonnegative(),
  provenance: CreditPassportProvenanceTypeSchema,
}) satisfies z.ZodType<CreditPassportInvoiceActivity>;

export const CreditPassportInventoryPositionSchema = z.object({
  isApplicable: z.boolean(),
  inventoryValueMinor: z.number().int().nullable(),
  trackedItemsCount: z.number().int().nonnegative(),
  lowStockCount: z.number().int().nonnegative(),
  outOfStockCount: z.number().int().nonnegative(),
  provenance: CreditPassportProvenanceTypeSchema,
}) satisfies z.ZodType<CreditPassportInventoryPosition>;

export const CreditPassportHealthSummarySchema = z.object({
  score: z.number().int().min(0).max(100).nullable(),
  scoreBand: z.string().nullable(),
  formulaVersion: z.string(),
  dataCoverage: z.string(),
  asOf: z.string(),
  disclaimer: z.string(),
  provenance: CreditPassportProvenanceTypeSchema,
}) satisfies z.ZodType<CreditPassportHealthSummary>;

export const CreditPassportDataCoverageSectionSchema = z.object({
  level: CreditPassportDataCoverageSchema,
  recordedDays: z.number().int().nonnegative(),
  hasSales: z.boolean(),
  hasExpenses: z.boolean(),
  hasInvoices: z.boolean(),
  hasInventory: z.boolean(),
  summaryText: z.string(),
}) satisfies z.ZodType<CreditPassportDataCoverageSection>;

export const CreditPassportExplanationSchema = z.object({
  headline: z.string().min(1).max(200),
  overview: z.string().min(1).max(2000),
  highlightKeys: z.array(CreditPassportHighlightKeySchema),
  attentionKeys: z.array(CreditPassportAttentionKeySchema),
  promptVersion: z.string(),
  responseSchemaVersion: z.string(),
  modelId: z.string(),
  createdAt: z.string(),
}) satisfies z.ZodType<CreditPassportExplanation>;

export const CreditPassportPayloadSchema = z.object({
  passportSchemaVersion: z.string(),
  businessIdentity: CreditPassportBusinessIdentitySchema,
  passportPeriod: z.object({
    start: z.string(),
    end: z.string(),
  }),
  recordedHistory: CreditPassportRecordedHistorySchema,
  financialPerformance: CreditPassportFinancialPerformanceSchema,
  currentPosition: CreditPassportCurrentPositionSchema,
  invoiceActivity: CreditPassportInvoiceActivitySchema,
  inventoryPosition: CreditPassportInventoryPositionSchema,
  healthScore: CreditPassportHealthSummarySchema,
  dataCoverage: CreditPassportDataCoverageSectionSchema,
  disclaimers: z.array(z.string()),
  asOfTimestamp: z.string(),
  sourceFingerprint: z.string(),
}) satisfies z.ZodType<CreditPassportPayload>;

export const CreditPassportSnapshotSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  passportCode: z.string(),
  passportVersion: z.number().int().positive(),
  passportSchemaVersion: z.string(),
  status: CreditPassportStatusSchema,
  periodStart: z.string(),
  periodEnd: z.string(),
  asOfTimestamp: z.string(),
  generatedByUserId: z.string().uuid(),
  sourceFingerprint: z.string(),
  artifactHash: z.string(),
  dataCoverage: CreditPassportDataCoverageSchema,
  payload: CreditPassportPayloadSchema,
  healthScoreSnapshotId: z.string().uuid().nullable(),
  aiExplanation: CreditPassportExplanationSchema.nullable(),
  createdAt: z.string(),
  isCurrent: z.boolean().optional(),
}) satisfies z.ZodType<CreditPassportSnapshot>;

export const GenerateCreditPassportInputSchema = z.object({
  idempotencyKey: z.string().min(8).max(128).optional(),
}) satisfies z.ZodType<GenerateCreditPassportInput>;

export const CreateCreditPassportShareInputSchema = z.object({
  snapshotId: z.string().uuid(),
  expiresInDays: z.number().int().min(1).max(30).optional().default(7),
}) satisfies z.ZodType<CreateCreditPassportShareInput>;

export const ExplainCreditPassportInputSchema = z.object({
  snapshotId: z.string().uuid(),
}) satisfies z.ZodType<ExplainCreditPassportInput>;

export const StructuredCreditPassportExplanationResponseSchema = z.object({
  schemaVersion: z.literal('1.0.0').default('1.0.0'),
  headline: z.string().min(1).max(200),
  overview: z.string().min(1).max(2000),
  highlightKeys: z.array(CreditPassportHighlightKeySchema).default([]),
  attentionKeys: z.array(CreditPassportAttentionKeySchema).default([]),
});

// ============================================================================
// T3-P08: Intelligence Jobs & Automation Foundation Schemas
// ============================================================================

export const AutomationTypeSchema = z.enum([
  'business_summary',
  'health_score_refresh',
  'attention_scan',
]) satisfies z.ZodType<AutomationType>;

export const AutomationFrequencySchema = z.enum([
  'daily',
  'weekly',
  'monthly',
  'off',
]) satisfies z.ZodType<AutomationFrequency>;

export const AutomationRunStatusSchema = z.enum([
  'queued',
  'running',
  'succeeded',
  'failed',
  'skipped',
  'cancelled',
]) satisfies z.ZodType<AutomationRunStatus>;

export const AutomationJobTypeSchema = z.enum([
  'scheduled_business_summary',
  'scheduled_health_refresh',
  'scheduled_attention_scan',
  'manual_business_summary',
  'manual_health_refresh',
  'manual_attention_scan',
]) satisfies z.ZodType<AutomationJobType>;

export const AutomationResultTypeSchema = z.enum([
  'summary_created',
  'summary_reused',
  'health_snapshot_created',
  'health_snapshot_reused',
  'attention_scan_completed',
  'skipped',
]) satisfies z.ZodType<AutomationResultType>;

export const AutomationSkipReasonSchema = z.enum([
  'AUTOMATION_DISABLED',
  'BUSINESS_RESTRICTED',
  'FEATURE_DISABLED',
  'AI_DISABLED',
  'SOURCE_UNCHANGED',
  'INSUFFICIENT_DATA',
  'STALE_SCHEDULE_VERSION',
  'UNAUTHORIZED',
]) satisfies z.ZodType<AutomationSkipReason>;

export const BusinessAttentionTypeSchema = z.enum([
  'LOW_STOCK_PRESENT',
  'OUT_OF_STOCK_PRESENT',
  'OVERDUE_INVOICES_PRESENT',
  'BOOKKEEPER_REVIEW_PENDING',
  'CREDIT_PASSPORT_STALE',
  'HEALTH_SCORE_CHANGED',
  'AUTOMATION_JOB_FAILED',
]) satisfies z.ZodType<BusinessAttentionType>;

export const BusinessAttentionCategorySchema = z.enum([
  'STATEFUL',
  'OCCURRENCE',
]) satisfies z.ZodType<BusinessAttentionCategory>;

export const BusinessAttentionSeveritySchema = z.enum([
  'info',
  'attention',
  'important',
]) satisfies z.ZodType<BusinessAttentionSeverity>;

export const BusinessAttentionStatusSchema = z.enum([
  'active',
  'resolved',
  'dismissed',
]) satisfies z.ZodType<BusinessAttentionStatus>;

export const BusinessAutomationSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  automationType: AutomationTypeSchema,
  enabled: z.boolean(),
  frequency: AutomationFrequencySchema,
  scheduleLocalTime: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Must be HH:MM format'),
  scheduleWeekday: z.number().int().min(1).max(7).nullable(),
  scheduleMonthday: z.number().int().min(1).max(31).nullable(),
  configVersion: z.number().int().positive(),
  createdByUserId: z.string().uuid().nullable(),
  updatedByUserId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<BusinessAutomation>;

export const IntelligenceJobRunSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  automationId: z.string().uuid().nullable(),
  jobType: AutomationJobTypeSchema,
  idempotencyKey: z.string(),
  status: AutomationRunStatusSchema,
  scheduledFor: z.string().nullable(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  attemptCount: z.number().int().positive(),
  sourceFingerprint: z.string().nullable(),
  resultType: AutomationResultTypeSchema.nullable(),
  resultId: z.string().nullable(),
  providerInvocationId: z.string().uuid().nullable(),
  errorCode: z.string().nullable(),
  skipReason: AutomationSkipReasonSchema.nullable(),
  correlationId: z.string().nullable(),
  createdAt: z.string(),
}) satisfies z.ZodType<IntelligenceJobRun>;

export const BusinessAttentionEventSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  type: BusinessAttentionTypeSchema,
  category: BusinessAttentionCategorySchema,
  dedupeKey: z.string(),
  status: BusinessAttentionStatusSchema,
  severity: BusinessAttentionSeveritySchema,
  firstDetectedAt: z.string(),
  lastDetectedAt: z.string(),
  resolvedAt: z.string().nullable(),
  sourceType: z.string(),
  sourceReference: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<BusinessAttentionEvent>;

export const UpdateAutomationInputSchema = z.object({
  automationType: AutomationTypeSchema,
  enabled: z.boolean(),
  frequency: AutomationFrequencySchema,
  scheduleLocalTime: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Must be HH:MM format').optional(),
  scheduleWeekday: z.number().int().min(1).max(7).nullable().optional(),
  scheduleMonthday: z.number().int().min(1).max(31).nullable().optional(),
}).refine(
  (data) => {
    if (data.frequency === 'weekly' && data.enabled) {
      return typeof data.scheduleWeekday === 'number' && data.scheduleWeekday >= 1 && data.scheduleWeekday <= 7;
    }
    return true;
  },
  { message: 'Weekday (1-7) is required when frequency is weekly and enabled', path: ['scheduleWeekday'] }
).refine(
  (data) => {
    if (data.frequency === 'monthly' && data.enabled) {
      return typeof data.scheduleMonthday === 'number' && data.scheduleMonthday >= 1 && data.scheduleMonthday <= 31;
    }
    return true;
  },
  { message: 'Monthday (1-31) is required when frequency is monthly and enabled', path: ['scheduleMonthday'] }
) satisfies z.ZodType<UpdateAutomationInput>;

export const RunAutomationNowInputSchema = z.object({
  automationType: AutomationTypeSchema,
  idempotencyKey: z.string().min(8).max(128).optional(),
}) satisfies z.ZodType<RunAutomationNowInput>;

export const RunAutomationNowResultSchema = z.object({
  jobRunId: z.string().uuid(),
  status: AutomationRunStatusSchema,
  resultType: AutomationResultTypeSchema.nullable(),
  resultId: z.string().nullable(),
  skipReason: AutomationSkipReasonSchema.nullable(),
  isReused: z.boolean().optional(),
}) satisfies z.ZodType<RunAutomationNowResult>;

// ==============================================================================
// TRANCHE 3 — PROMPT 9: NOTIFICATION & ATTENTION CENTER SCHEMAS
// ==============================================================================

export const NotificationCategorySchema = z.enum([
  'INVENTORY',
  'INVOICES',
  'BOOKKEEPER',
  'BUSINESS_HEALTH',
  'CREDIT_PASSPORT',
  'BUSINESS_SUMMARIES',
  'AUTOMATIONS',
]);

export const NotificationTypeSchema = z.enum([
  'LOW_STOCK',
  'OUT_OF_STOCK',
  'OVERDUE_INVOICE',
  'BOOKKEEPER_REVIEW_PENDING',
  'BUSINESS_HEALTH_CHANGED',
  'CREDIT_PASSPORT_STALE',
  'BUSINESS_SUMMARY_READY',
  'AUTOMATION_FAILED',
]);

export const NotificationChannelSchema = z.enum(['IN_APP', 'WHATSAPP']);

export const NotificationActionKeySchema = z.enum([
  'OPEN_INVENTORY',
  'OPEN_INVOICES',
  'OPEN_AI_BOOKKEEPER',
  'OPEN_BUSINESS_HEALTH',
  'OPEN_CREDIT_PASSPORT',
  'OPEN_BUSINESS_INSIGHTS',
  'OPEN_AUTOMATIONS',
  'OPEN_AUTOMATION_HISTORY',
]);

export const BusinessNotificationSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  recipientUserId: z.string().uuid(),
  sourceEventId: z.string().nullable(),
  notificationCategory: NotificationCategorySchema,
  notificationType: NotificationTypeSchema,
  dedupeKey: z.string(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  payload: z.record(z.string(), z.unknown()),
  primaryActionKey: NotificationActionKeySchema,
  sourceReferenceType: z.string().nullable(),
  sourceReferenceId: z.string().nullable(),
  requiredCapabilities: z.array(z.string()),
  channel: NotificationChannelSchema,
  createdAt: z.string(),
  readAt: z.string().nullable(),
  resolvedAt: z.string().nullable(),
}) satisfies z.ZodType<BusinessNotification>;

export const NotificationPreferenceSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  userId: z.string().uuid(),
  category: NotificationCategorySchema,
  channel: NotificationChannelSchema,
  enabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  updatedByUserId: z.string().uuid(),
}) satisfies z.ZodType<NotificationPreference>;

export const BusinessAttentionItemSchema = z.object({
  id: z.string(),
  businessId: z.string().uuid(),
  type: BusinessAttentionTypeSchema,
  category: BusinessAttentionCategorySchema,
  severity: BusinessAttentionSeveritySchema,
  title: z.string(),
  description: z.string(),
  firstDetectedAt: z.string(),
  lastDetectedAt: z.string(),
  sourceType: z.string(),
  sourceReference: z.string().nullable(),
  primaryActionKey: NotificationActionKeySchema,
  requiredCapabilities: z.array(z.string()),
  metadata: z.record(z.string(), z.unknown()),
}) satisfies z.ZodType<BusinessAttentionItem>;

export const BusinessAttentionSummarySchema = z.object({
  businessId: z.string().uuid(),
  totalActiveCount: z.number().int().min(0),
  items: z.array(BusinessAttentionItemSchema),
  groupedByCategory: z.object({
    INVENTORY: z.array(BusinessAttentionItemSchema),
    INVOICES: z.array(BusinessAttentionItemSchema),
    BOOKKEEPER: z.array(BusinessAttentionItemSchema),
    BUSINESS_HEALTH: z.array(BusinessAttentionItemSchema),
    CREDIT_PASSPORT: z.array(BusinessAttentionItemSchema),
    BUSINESS_SUMMARIES: z.array(BusinessAttentionItemSchema),
    AUTOMATIONS: z.array(BusinessAttentionItemSchema),
  }),
}) satisfies z.ZodType<BusinessAttentionSummary>;

export const NotificationFeedResponseSchema = z.object({
  notifications: z.array(BusinessNotificationSchema),
  totalUnreadCount: z.number().int().min(0),
  hasMore: z.boolean(),
  nextCursor: z.string().nullable().optional(),
}) satisfies z.ZodType<NotificationFeedResponse>;

export const UnreadNotificationCountResponseSchema = z.object({
  unreadCount: z.number().int().min(0),
}) satisfies z.ZodType<UnreadNotificationCountResponse>;

export const UpdateNotificationPreferenceInputSchema = z.object({
  category: NotificationCategorySchema,
  channel: NotificationChannelSchema,
  enabled: z.boolean(),
}) satisfies z.ZodType<UpdateNotificationPreferenceInput>;

export const MarkNotificationReadInputSchema = z.object({
  notificationId: z.string().uuid(),
}) satisfies z.ZodType<MarkNotificationReadInput>;

export const MarkAllNotificationsReadInputSchema = z.object({
  businessId: z.string().uuid(),
}) satisfies z.ZodType<MarkAllNotificationsReadInput>;

// ============================================================================
// WhatsApp Business Integration Schemas (T3-P10)
// ============================================================================

export const WhatsAppConnectionStatusSchema = z.enum(['PENDING', 'ACTIVE', 'OPTED_OUT', 'REVOKED']);
export const WhatsAppConsentStatusSchema = z.enum(['CONSENTED', 'OPTED_OUT', 'REVOKED']);
export const WhatsAppDeliveryStatusSchema = z.enum(['QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED']);
export const WhatsAppMessageTypeSchema = z.enum(['template', 'text']);

export const WhatsAppInboundCommandTypeSchema = z.enum([
  'HELP',
  'STOP',
  'START',
  'BUSINESS',
  'SWITCH_BUSINESS',
  'ASK_NNOO',
  'CONNECT',
  'UNRECOGNIZED',
]);

export const CreateWhatsAppLinkInputSchema = z.object({
  businessId: z.string().uuid(),
});

export const SwitchWhatsAppBusinessInputSchema = z.object({
  targetBusinessId: z.string().uuid(),
});

export const WhatsAppConnectionSummarySchema = z.object({
  isConnected: z.boolean(),
  status: WhatsAppConnectionStatusSchema,
  maskedPhone: z.string().nullable(),
  activeBusinessId: z.string().uuid(),
  activeBusinessName: z.string().optional(),
  linkedAt: z.string().nullable(),
  availableBusinesses: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        slug: z.string(),
        role: z.string(),
        isActive: z.boolean(),
      })
    )
    .optional(),
});

// ==============================================================================
// PLATFORM ADMIN INTELLIGENCE VALIDATION (Prompt 11)
// ==============================================================================

export const IntelligenceReportingPeriodSchema = z.enum(['24h', '7d', '30d']);

export const IntelligenceSystemStatusSchema = z.enum(['HEALTHY', 'DEGRADED', 'NOT_CONFIGURED', 'UNAVAILABLE']);

export const PlatformFeatureKeySchema = z.enum([
  'global_ai_enabled',
  'ask_nnoo_enabled',
  'ai_bookkeeper_enabled',
  'business_summaries_enabled',
  'health_score_enabled',
  'credit_passport_enabled',
  'automations_enabled',
  'notifications_enabled',
  'whatsapp_enabled',
]);

export const UpdatePlatformFeatureControlInputSchema = z.object({
  featureKey: PlatformFeatureKeySchema,
  enabled: z.boolean(),
  reason: z.string().min(3, 'Audit reason must be at least 3 characters').max(500, 'Audit reason cannot exceed 500 characters'),
});

export const RetryFailedJobInputSchema = z.object({
  jobRunId: z.string().uuid(),
  reason: z.string().min(3, 'Audit reason must be at least 3 characters').max(500, 'Audit reason cannot exceed 500 characters'),
});

export const RetryFailedWhatsAppDeliveryInputSchema = z.object({
  deliveryId: z.string().uuid(),
  reason: z.string().min(3, 'Audit reason must be at least 3 characters').max(500, 'Audit reason cannot exceed 500 characters'),
});

// ==============================================================================
// MOBILE PUSH NOTIFICATION VALIDATION (Prompt 12)
// ==============================================================================

export const PushProviderSchema = z.enum(['EXPO', 'FCM', 'APNS']);
export const PushDeviceStatusSchema = z.enum(['ACTIVE', 'REVOKED', 'EXPIRED']);
export const PushPermissionStateSchema = z.enum(['GRANTED', 'DENIED', 'UNDETERMINED']);
export const PushPlatformSchema = z.enum(['ios', 'android', 'web']);

export const RegisterPushDeviceInputSchema = z.object({
  installationId: z.string().min(1, 'Installation ID is required').max(256),
  pushToken: z.string().min(1, 'Push token is required').max(512),
  platform: PushPlatformSchema,
  provider: PushProviderSchema.optional().default('EXPO'),
  appVersion: z.string().max(32).optional(),
  permissionState: PushPermissionStateSchema.optional().default('GRANTED'),
});

export const RevokePushDeviceInputSchema = z.object({
  installationId: z.string().min(1, 'Installation ID is required').max(256),
});

