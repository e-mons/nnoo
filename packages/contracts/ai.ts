/**
 * NNOO Production AI & Intelligence Foundation Contracts
 * Strictly typed shared contracts safe for both Web and Mobile consumers.
 * DOES NOT import server-only AI SDKs or secrets.
 */

export type AIFeatureKey =
  | 'ai.foundation.smoke'
  | 'ai.bookkeeper.classify'
  | 'ai.bookkeeper.explain'
  | 'ai.summary.business'
  | 'ai.ask_nnoo'
  | 'ai.health.explain'
  | 'ai.credit_passport.explain';

export type AIInvocationStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'blocked'
  | 'timeout'
  | 'rate_limited';

export type AIErrorCode =
  | 'AI_CONFIGURATION_UNAVAILABLE'
  | 'AI_FEATURE_DISABLED'
  | 'AI_FORBIDDEN'
  | 'AI_BUSINESS_RESTRICTED'
  | 'AI_INVALID_INPUT'
  | 'AI_CONTEXT_TOO_LARGE'
  | 'AI_RATE_LIMITED'
  | 'AI_PROVIDER_RATE_LIMITED'
  | 'AI_PROVIDER_UNAVAILABLE'
  | 'AI_PROVIDER_TIMEOUT'
  | 'AI_MODEL_UNAVAILABLE'
  | 'AI_RESPONSE_INVALID'
  | 'AI_RESPONSE_BLOCKED'
  | 'AI_TOOL_NOT_ALLOWED'
  | 'AI_TOOL_INPUT_INVALID'
  | 'AI_TOOL_FORBIDDEN'
  | 'AI_INTERNAL_ERROR'
  | 'AI_BOOKKEEPER_INVALID_INPUT'
  | 'AI_BOOKKEEPER_FORBIDDEN'
  | 'AI_BOOKKEEPER_CLASSIFICATION_FAILED'
  | 'AI_BOOKKEEPER_INVALID_RESULT'
  | 'AI_BOOKKEEPER_CANDIDATE_STALE'
  | 'AI_BOOKKEEPER_IDEMPOTENCY_CONFLICT'
  | 'AI_BOOKKEEPER_SOURCE_NOT_FOUND'
  | 'AI_BOOKKEEPER_BUSINESS_RESTRICTED'
  | 'AI_BOOKKEEPER_REVIEW_NOT_FOUND'
  | 'AI_BOOKKEEPER_REVIEW_FORBIDDEN'
  | 'AI_BOOKKEEPER_ALREADY_APPLIED'
  | 'AI_BOOKKEEPER_ALREADY_REJECTED'
  | 'AI_BOOKKEEPER_STALE_CLASSIFICATION'
  | 'AI_BOOKKEEPER_INVALID_FINAL_OPERATION'
  | 'AI_BOOKKEEPER_MISSING_REQUIRED_DATA'
  | 'AI_BOOKKEEPER_APPLICATION_FAILED'
  | 'AI_BOOKKEEPER_APPLICATION_CONFLICT'
  | 'AI_BOOKKEEPER_TARGET_NOT_FOUND'
  | 'AI_BOOKKEEPER_TARGET_ALREADY_SETTLED'
  | 'AI_BOOKKEEPER_RECLASSIFICATION_REQUIRED'
  | 'AI_INSIGHTS_FORBIDDEN'
  | 'AI_INSIGHTS_INVALID_PERIOD'
  | 'AI_INSIGHTS_INSUFFICIENT_DATA'
  | 'AI_INSIGHTS_FACT_BUILD_FAILED'
  | 'AI_INSIGHTS_GENERATION_FAILED'
  | 'AI_INSIGHTS_INVALID_RESULT'
  | 'AI_INSIGHTS_STALE'
  | 'AI_INSIGHTS_NOT_FOUND'
  | 'AI_INSIGHTS_IDEMPOTENCY_CONFLICT'
  | 'AI_INSIGHTS_BUSINESS_RESTRICTED'
  | 'ASK_NNOO_FORBIDDEN'
  | 'ASK_NNOO_INVALID_MESSAGE'
  | 'ASK_NNOO_CONVERSATION_NOT_FOUND'
  | 'ASK_NNOO_CONVERSATION_FORBIDDEN'
  | 'ASK_NNOO_TOOL_NOT_ALLOWED'
  | 'ASK_NNOO_TOOL_INPUT_INVALID'
  | 'ASK_NNOO_DATA_UNAVAILABLE'
  | 'ASK_NNOO_NEEDS_CLARIFICATION'
  | 'ASK_NNOO_INVALID_RESPONSE'
  | 'ASK_NNOO_IDEMPOTENCY_CONFLICT'
  | 'BUSINESS_HEALTH_FORBIDDEN'
  | 'BUSINESS_HEALTH_INSUFFICIENT_DATA'
  | 'BUSINESS_HEALTH_CALCULATION_FAILED'
  | 'BUSINESS_HEALTH_FORMULA_INVALID'
  | 'BUSINESS_HEALTH_SNAPSHOT_NOT_FOUND'
  | 'BUSINESS_HEALTH_BUSINESS_RESTRICTED'
  | 'BUSINESS_HEALTH_IDEMPOTENCY_CONFLICT'
  | 'BUSINESS_HEALTH_EXPLANATION_FAILED'
  | 'BUSINESS_HEALTH_EXPLANATION_INVALID'
  | 'CREDIT_PASSPORT_FORBIDDEN'
  | 'CREDIT_PASSPORT_INSUFFICIENT_DATA'
  | 'CREDIT_PASSPORT_GENERATION_FAILED'
  | 'CREDIT_PASSPORT_NOT_FOUND'
  | 'CREDIT_PASSPORT_BUSINESS_RESTRICTED'
  | 'AI_CREDIT_PASSPORT_IDEMPOTENCY_CONFLICT'
  | 'AI_AUTOMATION_INVALID_INPUT'
  | 'AI_AUTOMATION_FORBIDDEN'
  | 'AI_AUTOMATION_DISABLED'
  | 'AI_AUTOMATION_BUSINESS_RESTRICTED'
  | 'AI_AUTOMATION_RATE_LIMITED'
  | 'AI_AUTOMATION_RUN_FAILED'
  | 'AI_AUTOMATION_IDEMPOTENCY_CONFLICT'
  | 'AI_AUTOMATION_SCHEDULE_CONFLICT'
  | 'CREDIT_PASSPORT_SHARE_FORBIDDEN'
  | 'CREDIT_PASSPORT_SHARE_NOT_FOUND'
  | 'CREDIT_PASSPORT_SHARE_EXPIRED'
  | 'CREDIT_PASSPORT_SHARE_REVOKED'
  | 'CREDIT_PASSPORT_VERIFICATION_FAILED'
  | 'CREDIT_PASSPORT_PDF_FAILED'
  | 'CREDIT_PASSPORT_EXPLANATION_FAILED'
  | 'CREDIT_PASSPORT_EXPLANATION_INVALID'
  | 'ASK_NNOO_RATE_LIMITED'
  | 'ASK_NNOO_BUSINESS_RESTRICTED'
  | WhatsAppErrorCode
  | AdminIntelligenceErrorCode
  | PushNotificationErrorCode;




export type AIPromptVersion = string;
export type AIResponseSchemaVersion = string;

export interface AIUsageMetadata {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface AISafeError {
  code: AIErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export interface VerifiedFactEnvelope<T> {
  schemaVersion: string;
  businessId?: string;
  generatedAt: string;
  source: string;
  data: T;
}

export interface FoundationSmokeResponse {
  status: 'ok';
  message: string;
  echoFact?: string;
  timestamp: string;
}

export interface AIToolDefinition {
  name: string;
  description: string;
  readOnly: boolean;
  requiredPermission?: string;
  parametersSchema: Record<string, unknown>;
}

export interface AIModelPolicy {
  defaultModel: string;
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
}

export interface AIInvocationRecord {
  id: string;
  business_id: string | null;
  user_id: string | null;
  feature_key: AIFeatureKey;
  prompt_version: AIPromptVersion;
  response_schema_version: AIResponseSchemaVersion;
  model_id: string;
  status: AIInvocationStatus;
  provider_request_id: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  latency_ms: number | null;
  error_code: string | null;
  request_fingerprint: string | null;
  created_at: string;
  completed_at: string | null;
}

// ============================================================================
// TRANCHE 3 PROMPT 2: AI BOOKKEEPER TAXONOMY & CLASSIFICATION CONTRACTS
// ============================================================================

export type BookkeepingOperationKind =
  | 'OPERATING_EXPENSE'
  | 'STOCK_PURCHASE'
  | 'CUSTOMER_PAYMENT'
  | 'SUPPLIER_PAYMENT'
  | 'SALE'
  | 'REFUND'
  | 'UNKNOWN'
  | 'UNSUPPORTED';

export type BookkeepingTransactionDirection =
  | 'MONEY_IN'
  | 'MONEY_OUT'
  | 'UNKNOWN';

export type BookkeepingConfidenceBand =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW';

export type BookkeepingMissingField =
  | 'AMOUNT_REQUIRED'
  | 'CUSTOMER_REQUIRED'
  | 'SUPPLIER_REQUIRED'
  | 'PAYABLE_SELECTION_REQUIRED'
  | 'SALE_SELECTION_REQUIRED'
  | 'PRODUCT_LINES_REQUIRED'
  | 'PAYMENT_METHOD_REQUIRED'
  | 'REFERENCE_RECOMMENDED'
  | 'CATEGORY_REVIEW_REQUIRED';

export type BookkeepingWarningCode =
  | 'AMBIGUOUS_DESCRIPTION'
  | 'POSSIBLE_DUPLICATE'
  | 'COUNTERPARTY_NOT_MATCHED'
  | 'MULTIPLE_COUNTERPARTY_MATCHES'
  | 'UNSUPPORTED_OPERATION'
  | 'DIRECTION_CONFLICT'
  | 'CATEGORY_NOT_CONFIDENT'
  | 'INSUFFICIENT_INFORMATION';

export interface BookkeepingCategoryCandidate {
  candidateKey: string;
  name: string;
  systemKey?: string | null;
}

export interface BookkeepingSupplierCandidate {
  candidateKey: string;
  displayName: string;
}

export interface BookkeepingCustomerCandidate {
  candidateKey: string;
  displayName: string;
}

export interface BookkeepingDuplicateCandidate {
  candidateKey: string;
  occurredAt: string;
  amountMinor: number;
  reference?: string | null;
  operationType: string;
  counterpartyName?: string | null;
}

export interface BookkeepingClassificationInput {
  businessId?: string;
  description: string;
  amountMinor?: number | null;
  currencyCode?: string;
  transactionDirection?: BookkeepingTransactionDirection | null;
  transactionDate?: string | null;
  paymentMethod?: string | null;
  reference?: string | null;
  counterpartyText?: string | null;
  idempotencyKey?: string | null;
  sourceKind?: string;
  sourceRecordType?: string | null;
  sourceRecordId?: string | null;
}

/**
 * Raw structured output schema expected from Gemini API.
 * Gemini chooses only from candidate keys, never database UUIDs.
 */
export interface BookkeepingStructuredOutput {
  schemaVersion?: string;
  operationKind: BookkeepingOperationKind;
  confidenceBand: BookkeepingConfidenceBand;
  categoryCandidateKey?: string | null;
  supplierCandidateKey?: string | null;
  customerCandidateKey?: string | null;
  possibleDuplicateCandidateKeys?: string[];
  missingFields?: BookkeepingMissingField[];
  warningCodes?: BookkeepingWarningCode[];
  shortExplanation: string;
}

export interface BookkeepingClassificationResult {
  id: string;
  businessId: string;
  requestedByUserId: string;
  description: string;
  amountMinor?: number | null;
  currencyCode: string;
  transactionDirection?: BookkeepingTransactionDirection | null;
  transactionDate?: string | null;
  paymentMethod?: string | null;
  referenceText?: string | null;
  counterpartyText?: string | null;
  inputFingerprint: string;
  idempotencyKey?: string | null;
  operationKind: BookkeepingOperationKind;
  confidenceBand: BookkeepingConfidenceBand;
  categorySuggestion?: {
    id: string;
    name: string;
  } | null;
  supplierSuggestion?: {
    id: string;
    name: string;
  } | null;
  customerSuggestion?: {
    id: string;
    name: string;
  } | null;
  possibleDuplicateIds?: string[];
  missingFields: BookkeepingMissingField[];
  warningCodes: BookkeepingWarningCode[];
  shortExplanation: string;
  requiresHumanReview: true;
  promptVersion: string;
  responseSchemaVersion: string;
  modelId: string;
  aiInvocationId?: string | null;
  classificationStatus: BookkeepingClassificationStatus;
  createdAt: string;
  supersededAt?: string | null;
}

export type BookkeepingClassificationStatus = 
  | 'pending_review' 
  | 'applied' 
  | 'rejected' 
  | 'superseded' 
  | 'analysis_failed';

export type BookkeepingReviewAction = 
  | 'confirmed' 
  | 'corrected' 
  | 'rejected' 
  | 'reclassified';

export type BookkeepingFinalOperationKind = 
  | 'OPERATING_EXPENSE' 
  | 'STOCK_PURCHASE' 
  | 'CUSTOMER_PAYMENT' 
  | 'SUPPLIER_PAYMENT' 
  | 'SALE' 
  | 'REFUND';

export type BookkeepingApplicationStatus = 
  | 'pending' 
  | 'succeeded' 
  | 'failed';

export type BookkeepingApplicationTargetType = 
  | 'EXPENSE' 
  | 'STOCK_RECEIPT' 
  | 'SALE_PAYMENT' 
  | 'EXPENSE_PAYMENT' 
  | 'STOCK_RECEIPT_PAYMENT' 
  | 'SALE' 
  | 'SALE_REFUND';

export type BookkeepingCorrectionState = 
  | 'accepted' 
  | 'corrected' 
  | 'cleared' 
  | 'not_applicable';

export type BookkeepingDuplicateWarningState = 
  | 'none' 
  | 'acknowledged' 
  | 'confirmed_duplicate' 
  | 'not_duplicate';

export type BookkeepingRejectionReason = 
  | 'NOT_A_BUSINESS_TRANSACTION' 
  | 'DUPLICATE' 
  | 'INCORRECT_SUGGESTION' 
  | 'NO_LONGER_NEEDED' 
  | 'TEST_OR_ERROR' 
  | 'OTHER';

export interface ReclassifyBookkeepingInput {
  classificationId: string;
  modifiedDescription?: string;
  modifiedAmountMinor?: number | null;
  modifiedDirection?: BookkeepingTransactionDirection | null;
  modifiedDate?: string | null;
  modifiedPaymentMethod?: string | null;
  modifiedReference?: string | null;
  modifiedCounterparty?: string | null;
  idempotencyKey?: string | null;
}

export interface RejectBookkeepingInput {
  classificationId: string;
  reasonCode: BookkeepingRejectionReason;
  notes?: string | null;
}

export interface CorrectBookkeepingInput {
  classificationId: string;
  correctedOperationKind: BookkeepingFinalOperationKind;
  correctedCategoryId?: string | null;
  correctedSupplierId?: string | null;
  correctedCustomerId?: string | null;
  duplicateWarningAcknowledged?: boolean;
  reviewNotes?: string | null;
}

// Operation-specific payload contracts
export interface ExpenseApplyPayload {
  amountMinor: number;
  expenseCategoryId: string;
  description: string;
  occurredAt: string;
  supplierId?: string | null;
  payment?: {
    amountMinor: number;
    paymentMethod: string;
    reference?: string | null;
    notes?: string | null;
  } | null;
  notes?: string | null;
  receiptUrl?: string | null;
}

export interface StockPurchaseApplyPayload {
  supplierId: string;
  receivedAt: string;
  supplierInvoiceNumber?: string | null;
  notes?: string | null;
  items: Array<{
    catalogItemId: string;
    quantity: number;
    unitCostMinor: number;
    batchNumber?: string | null;
    expiryDate?: string | null;
  }>;
  payment?: {
    amountMinor: number;
    paymentMethod: string;
    reference?: string | null;
    notes?: string | null;
  } | null;
}

export interface CustomerPaymentApplyPayload {
  saleId: string;
  amountMinor: number;
  paymentMethod: string;
  occurredAt: string;
  reference?: string | null;
  notes?: string | null;
}

export interface SupplierPaymentApplyPayload {
  payableSourceType: 'EXPENSE' | 'STOCK_RECEIPT';
  payableId: string;
  amountMinor: number;
  paymentMethod: string;
  occurredAt: string;
  reference?: string | null;
  notes?: string | null;
}

export interface SaleApplyPayload {
  customerId?: string | null;
  occurredAt: string;
  orderReference?: string | null;
  customerNotes?: string | null;
  staffNotes?: string | null;
  items: Array<{
    catalogItemId: string;
    quantity: number;
    unitPriceMinor?: number;
    discountMinor?: number;
    notes?: string | null;
  }>;
  payments: Array<{
    amountMinor: number;
    paymentMethod: string;
    reference?: string | null;
    notes?: string | null;
  }>;
}

export interface RefundApplyPayload {
  saleId: string;
  reason: string;
  occurredAt: string;
  items: Array<{
    saleItemId: string;
    quantity: number;
    restock: boolean;
  }>;
  payments: Array<{
    amountMinor: number;
    paymentMethod: string;
    reference?: string | null;
    notes?: string | null;
  }>;
}

// Discriminated Apply Input
export type ApplyBookkeepingPayload =
  | { finalOperationKind: 'OPERATING_EXPENSE'; payload: ExpenseApplyPayload }
  | { finalOperationKind: 'STOCK_PURCHASE'; payload: StockPurchaseApplyPayload }
  | { finalOperationKind: 'CUSTOMER_PAYMENT'; payload: CustomerPaymentApplyPayload }
  | { finalOperationKind: 'SUPPLIER_PAYMENT'; payload: SupplierPaymentApplyPayload }
  | { finalOperationKind: 'SALE'; payload: SaleApplyPayload }
  | { finalOperationKind: 'REFUND'; payload: RefundApplyPayload };

export type ApplyBookkeepingInput = ApplyBookkeepingPayload & {
  classificationId: string;
  reviewNotes?: string | null;
  idempotencyKey: string;
};

export interface BookkeepingApplicationResult {
  applicationId: string;
  classificationId: string;
  canonicalTargetType: BookkeepingApplicationTargetType;
  canonicalTargetId: string;
  canonicalTargetReference?: string;
  receiptId?: string | null;
  status: BookkeepingApplicationStatus;
  appliedAt: string;
}

export interface BookkeepingInboxItem {
  id: string;
  businessId: string;
  description: string;
  amountMinor?: number | null;
  currencyCode: string;
  transactionDirection?: BookkeepingTransactionDirection | null;
  transactionDate?: string | null;
  operationKind: BookkeepingOperationKind;
  confidenceBand: BookkeepingConfidenceBand;
  classificationStatus: BookkeepingClassificationStatus;
  warningCount: number;
  missingFieldCount: number;
  shortExplanation: string;
  createdAt: string;
  appliedTargetType?: BookkeepingApplicationTargetType | null;
  appliedTargetId?: string | null;
}

export interface BookkeepingReviewDetail extends BookkeepingClassificationResult {
  reviews?: Array<{
    id: string;
    reviewerUserId: string;
    reviewAction: BookkeepingReviewAction;
    aiOperationKind: string;
    finalOperationKind: string;
    reviewNotes?: string | null;
    createdAt: string;
  }>;
  application?: BookkeepingApplicationResult | null;
}

// ==============================================================================
// TRANCHE 3 — PROMPT 4: VERIFIED BUSINESS SUMMARIES & SMART INSIGHTS
// ==============================================================================

export type BusinessSummaryType = 'today' | 'this_week' | 'this_month' | 'custom';
export type BusinessSummaryStatus = 'ready' | 'failed' | 'superseded';

export interface BusinessSummaryPeriod {
  start: string;
  end: string;
  timezone: string;
  label: string;
}

export interface BusinessSummaryPeriodComparison {
  current: BusinessSummaryPeriod;
  previous?: BusinessSummaryPeriod;
  isComparable: boolean;
  reason?: string;
}

export interface VerifiedPerformanceFacts {
  grossSalesMinor: number;
  salesCount: number;
  refundsMinor: number;
  netSalesMinor: number;
  customerPaymentsReceivedMinor: number;
  cogsMinor: number;
  grossProfitMinor: number;
  operatingExpensesMinor: number;
  inventoryAdjustmentGainMinor: number;
  inventoryShrinkageLossMinor: number;
  operatingResultMinor: number;
}

export interface VerifiedCurrentPositionFacts {
  accountsReceivableMinor: number;
  accountsPayableMinor: number;
  inventoryValueMinor: number;
  lowStockCount: number;
  outOfStockCount: number;
  overdueInvoicesCount: number;
  asOfTimestamp: string;
}

export interface VerifiedFactBundle {
  schemaVersion: string;
  businessId: string;
  currencyCode: string;
  timezone: string;
  summaryType: BusinessSummaryType;
  period: BusinessSummaryPeriod;
  comparison?: BusinessSummaryPeriodComparison;
  performance: VerifiedPerformanceFacts;
  previousPerformance?: VerifiedPerformanceFacts | null;
  currentPosition: VerifiedCurrentPositionFacts;
  permittedFactKeys: string[];
  generatedAt: string;
  hasSufficientData: boolean;
}

export type BusinessInsightSignalType = 'performance' | 'position' | 'attention';
export type BusinessInsightSignalDirection = 'UP' | 'DOWN' | 'UNCHANGED' | 'NOT_COMPARABLE';

export type BusinessInsightSignalKey =
  | 'NET_SALES_CHANGE'
  | 'REFUNDS_PRESENT'
  | 'COGS_CHANGE'
  | 'GROSS_PROFIT_CHANGE'
  | 'OPERATING_EXPENSE_CHANGE'
  | 'OPERATING_RESULT_CHANGE'
  | 'OUTSTANDING_RECEIVABLES'
  | 'OUTSTANDING_PAYABLES'
  | 'LOW_STOCK_PRESENT'
  | 'OUT_OF_STOCK_PRESENT'
  | 'OVERDUE_INVOICES_PRESENT'
  | 'INVENTORY_POSITION';

export interface BusinessInsightSignal {
  signalKey: BusinessInsightSignalKey;
  type: BusinessInsightSignalType;
  direction: BusinessInsightSignalDirection;
  title: string;
  formattedMetric: string;
  changeDescription?: string;
  sourceProvenance: string;
  actionKey?: BusinessInsightActionKey;
}

export type BusinessInsightActionKey =
  | 'OPEN_SALES_REPORT'
  | 'OPEN_EXPENSE_REPORT'
  | 'OPEN_PROFITABILITY_REPORT'
  | 'OPEN_RECEIVABLES'
  | 'OPEN_PAYABLES'
  | 'OPEN_INVENTORY'
  | 'OPEN_LOW_STOCK'
  | 'OPEN_OVERDUE_INVOICES';

export interface BusinessInsightActionDefinition {
  key: BusinessInsightActionKey;
  label: string;
  routePath: string;
  description: string;
}

export interface StructuredBusinessSummaryResponse {
  schemaVersion: string;
  headline: string;
  overview: string;
  highlightSignalKeys: BusinessInsightSignalKey[];
  attentionSignalKeys: BusinessInsightSignalKey[];
  actionKeys: BusinessInsightActionKey[];
}

export interface GenerateBusinessSummaryInput {
  summaryType: BusinessSummaryType;
  startDate?: string;
  endDate?: string;
  idempotencyKey: string;
}

export interface BusinessSummaryDetail {
  id: string;
  businessId: string;
  summaryType: BusinessSummaryType;
  periodStart: string;
  periodEnd: string;
  asOfTimestamp: string;
  businessTimezone: string;
  currencyCode: string;
  headline: string;
  overview: string;
  selectedHighlightSignalKeys: BusinessInsightSignalKey[];
  selectedAttentionSignalKeys: BusinessInsightSignalKey[];
  selectedActionKeys: BusinessInsightActionKey[];
  sourceFingerprint: string;
  permissionScopeFingerprint: string;
  verifiedFactSnapshot: VerifiedFactBundle;
  promptVersion: string;
  modelId: string;
  status: BusinessSummaryStatus;
  isFresh: boolean;
  createdAt: string;
}

export interface BusinessSummaryHistoryItem {
  id: string;
  summaryType: BusinessSummaryType;
  periodStart: string;
  periodEnd: string;
  headline: string;
  status: BusinessSummaryStatus;
  createdAt: string;
}

// ============================================================================
// ASK NNOO PRODUCTION ASSISTANT CONTRACTS (T3-P05)
// ============================================================================

export type AskNnooConversationStatus = 'active' | 'archived';

export type AskNnooMessageRole = 'user' | 'assistant';

export type AskNnooResponseType =
  | 'ANSWER'
  | 'LIST'
  | 'COMPARISON'
  | 'EXPLANATION'
  | 'INSUFFICIENT_DATA'
  | 'FORBIDDEN'
  | 'UNSUPPORTED_REQUEST'
  | 'MUTATION_REQUIRES_WORKFLOW'
  | 'NEEDS_CLARIFICATION';

export type AskNnooSegmentType = 'TEXT' | 'FACT' | 'SAFE_ENTITY_LABEL';

export interface AskNnooResponseSegment {
  type: AskNnooSegmentType;
  text?: string | null;
  factKey?: string | null;
  formattedValue?: string | null;
  label?: string | null;
  entityKey?: string | null;
}

export type AskNnooSourceKey =
  | 'SALES_REPORT'
  | 'EXPENSE_REPORT'
  | 'PROFITABILITY_REPORT'
  | 'RECEIVABLES'
  | 'PAYABLES'
  | 'INVENTORY'
  | 'INVOICES'
  | 'BOOKKEEPER'
  | 'BUSINESS_OVERVIEW';

export type AskNnooActionKey =
  | 'OPEN_SALES_REPORT'
  | 'OPEN_EXPENSE_REPORT'
  | 'OPEN_PROFITABILITY_REPORT'
  | 'OPEN_RECEIVABLES'
  | 'OPEN_PAYABLES'
  | 'OPEN_INVENTORY'
  | 'OPEN_LOW_STOCK'
  | 'OPEN_INVOICES'
  | 'OPEN_OVERDUE_INVOICES'
  | 'OPEN_AI_BOOKKEEPER'
  | 'RECORD_EXPENSE'
  | 'CREATE_SALE';

export interface AskNnooActionDefinition {
  key: AskNnooActionKey;
  label: string;
  routePath: string;
  description: string;
}

export const ASK_NNOO_ACTION_REGISTRY: Record<AskNnooActionKey, AskNnooActionDefinition> = {
  OPEN_SALES_REPORT: {
    key: 'OPEN_SALES_REPORT',
    label: 'View Sales Report',
    routePath: '/reports/sales',
    description: 'Inspect itemized sales, payment records, and customer receipts.',
  },
  OPEN_EXPENSE_REPORT: {
    key: 'OPEN_EXPENSE_REPORT',
    label: 'View Expense Report',
    routePath: '/reports/expenses',
    description: 'Review operating expenditure and category breakdown.',
  },
  OPEN_PROFITABILITY_REPORT: {
    key: 'OPEN_PROFITABILITY_REPORT',
    label: 'View Profitability Report',
    routePath: '/reports/profitability',
    description: 'Analyze net sales, COGS, gross margins, and operating result.',
  },
  OPEN_RECEIVABLES: {
    key: 'OPEN_RECEIVABLES',
    label: 'View Receivables',
    routePath: '/reports/receivables',
    description: 'Inspect unpaid customer balances and credit sales.',
  },
  OPEN_PAYABLES: {
    key: 'OPEN_PAYABLES',
    label: 'View Payables',
    routePath: '/reports/payables',
    description: 'Review outstanding supplier bills and unpaid expenses.',
  },
  OPEN_INVENTORY: {
    key: 'OPEN_INVENTORY',
    label: 'View Inventory',
    routePath: '/inventory',
    description: 'Inspect stock levels, item valuation, and tracking.',
  },
  OPEN_LOW_STOCK: {
    key: 'OPEN_LOW_STOCK',
    label: 'View Low Stock Items',
    routePath: '/inventory?filter=low_stock',
    description: 'Review catalog products below reorder thresholds.',
  },
  OPEN_INVOICES: {
    key: 'OPEN_INVOICES',
    label: 'View Invoices',
    routePath: '/invoices',
    description: 'Manage sales invoices and customer payment tracking.',
  },
  OPEN_OVERDUE_INVOICES: {
    key: 'OPEN_OVERDUE_INVOICES',
    label: 'View Overdue Invoices',
    routePath: '/invoices?status=overdue',
    description: 'Manage invoices past their due payment dates.',
  },
  OPEN_AI_BOOKKEEPER: {
    key: 'OPEN_AI_BOOKKEEPER',
    label: 'Open AI Bookkeeper',
    routePath: '/bookkeeper',
    description: 'Record or review bookkeeping entries with AI assistance.',
  },
  RECORD_EXPENSE: {
    key: 'RECORD_EXPENSE',
    label: 'Record Expense',
    routePath: '/expenses/new',
    description: 'Directly record a new business operating expense.',
  },
  CREATE_SALE: {
    key: 'CREATE_SALE',
    label: 'Create Sale',
    routePath: '/sales/new',
    description: 'Directly record a new customer sale.',
  },
};

export type AskNnooToolKey =
  | 'getBusinessOverview'
  | 'getSalesSummary'
  | 'getProfitabilitySummary'
  | 'getExpenseSummary'
  | 'getReceivablesSummary'
  | 'getPayablesSummary'
  | 'getInventoryStatus'
  | 'getInvoiceStatus'
  | 'getBookkeeperStatus'
  | 'lookupCustomer'
  | 'lookupProduct';

export interface AskNnooFactReference {
  key: string;
  label: string;
  formattedValue: string;
  rawValue: number | string | boolean;
  domain: string;
  asOfTimestamp?: string;
}

export interface AskNnooEntityReference {
  key: string;
  entityType: 'customer' | 'supplier' | 'product' | 'sale' | 'invoice' | 'expense';
  displayName: string;
  secondaryInfo?: string;
  actionKey?: AskNnooActionKey;
  canonicalId?: string;
}

export interface StructuredAskNnooResponse {
  schemaVersion: string;
  responseType: AskNnooResponseType;
  headline?: string | null;
  segments: AskNnooResponseSegment[];
  factKeys: string[];
  entityKeys: string[];
  sourceKeys: AskNnooSourceKey[];
  actionKeys: AskNnooActionKey[];
  followUpQuestions: string[];
  requiredCapabilities: string[];
}

export interface AskNnooRenderedPayload {
  schemaVersion: string;
  responseType: AskNnooResponseType;
  headline?: string | null;
  segments: AskNnooResponseSegment[];
  facts: AskNnooFactReference[];
  entities: AskNnooEntityReference[];
  sourceKeys: AskNnooSourceKey[];
  actionKeys: AskNnooActionKey[];
  followUpQuestions: string[];
  isRedactedByRoleDowngrade?: boolean;
}

export interface AskNnooMessage {
  id: string;
  conversationId: string;
  businessId: string;
  ownerUserId: string;
  role: AskNnooMessageRole;
  userText: string | null;
  assistantResponsePayload: AskNnooRenderedPayload | null;
  sourceKeys: AskNnooSourceKey[];
  requiredCapabilities: string[];
  createdAt: string;
}

export interface AskNnooConversation {
  id: string;
  businessId: string;
  ownerUserId: string;
  title: string;
  status: AskNnooConversationStatus;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messageCount?: number;
}

export interface AskNnooConversationSummary {
  id: string;
  title: string;
  status: AskNnooConversationStatus;
  lastMessageAt: string;
  lastMessagePreview?: string;
}

export interface SendAskNnooMessageInput {
  conversationId?: string;
  message: string;
  idempotencyKey: string;
}

export interface SendAskNnooMessageResult {
  conversationId: string;
  userMessage: AskNnooMessage;
  assistantMessage: AskNnooMessage;
}

// ==============================================================================
// BUSINESS HEALTH SCORE CONTRACTS (Prompt 6)
// ==============================================================================

export type BusinessHealthScoreStatus = 'READY' | 'INSUFFICIENT_DATA';
export type BusinessHealthScoreBand = 'STRONG' | 'GOOD' | 'FAIR' | 'NEEDS_ATTENTION';

export type BusinessHealthDimensionKey =
  | 'SALES_PROFITABILITY'
  | 'OPERATING_EFFICIENCY'
  | 'RECEIVABLES_COLLECTION'
  | 'BUSINESS_OBLIGATIONS'
  | 'INVENTORY_READINESS';

export type BusinessHealthDimensionStatus = 'SUFFICIENT' | 'INSUFFICIENT_DATA' | 'NOT_APPLICABLE';
export type BusinessHealthDataCoverage = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';

export type BusinessHealthReasonKey =
  // Sales & Profitability
  | 'GROSS_PROFIT_STRONG'
  | 'GROSS_PROFIT_HEALTHY'
  | 'GROSS_PROFIT_LOW'
  | 'GROSS_PROFIT_NEGATIVE'
  | 'OPERATING_RESULT_POSITIVE'
  | 'OPERATING_RESULT_NEGATIVE'
  | 'SALES_VOLUME_ADEQUATE'
  | 'SALES_VOLUME_LOW'
  // Operating Efficiency
  | 'EXPENSE_MANAGEMENT_EFFICIENT'
  | 'EXPENSE_PRESSURE_MODERATE'
  | 'EXPENSE_PRESSURE_ELEVATED'
  | 'EXPENSES_EXCEED_GROSS_PROFIT'
  // Receivables & Collection
  | 'RECEIVABLES_MINIMAL'
  | 'RECEIVABLES_HEALTHY'
  | 'RECEIVABLES_ELEVATED'
  | 'OVERDUE_INVOICES_PRESENT'
  | 'NO_OVERDUE_INVOICES'
  // Business Obligations
  | 'PAYABLES_CLEAN'
  | 'PAYABLES_MANAGEABLE'
  | 'PAYABLES_ELEVATED'
  // Inventory Readiness
  | 'INVENTORY_OPTIMAL'
  | 'INVENTORY_STABLE'
  | 'LOW_STOCK_ALERT'
  | 'OUT_OF_STOCK_ALERT'
  | 'INVENTORY_NOT_APPLICABLE'
  // General / Coverage
  | 'DATA_COVERAGE_COMPREHENSIVE'
  | 'DATA_COVERAGE_ESTABLISHED'
  | 'DATA_COVERAGE_EARLY'
  | 'DATA_COVERAGE_INSUFFICIENT';

export type BusinessHealthActionKey =
  | 'OPEN_SALES_REPORT'
  | 'OPEN_PROFITABILITY_REPORT'
  | 'OPEN_EXPENSE_REPORT'
  | 'OPEN_RECEIVABLES'
  | 'OPEN_PAYABLES'
  | 'OPEN_LOW_STOCK'
  | 'OPEN_INVENTORY'
  | 'OPEN_OVERDUE_INVOICES';

export interface BusinessHealthDimensionResult {
  key: BusinessHealthDimensionKey;
  name: string;
  status: BusinessHealthDimensionStatus;
  score: number | null;
  configuredWeight: number;
  appliedWeight: number;
  reasonKeys: BusinessHealthReasonKey[];
  sourceFactKeys: string[];
}

export interface BusinessHealthExplanation {
  headline: string;
  overview: string;
  strengthReasonKeys: BusinessHealthReasonKey[];
  attentionReasonKeys: BusinessHealthReasonKey[];
  actionKeys: BusinessHealthActionKey[];
  promptVersion: string;
  responseSchemaVersion: string;
  modelId: string;
  aiInvocationId?: string;
  createdAt: string;
}

export interface BusinessHealthScoreResult {
  formulaVersion: string;
  status: BusinessHealthScoreStatus;
  score: number | null;
  scoreBand: BusinessHealthScoreBand | null;
  dataCoverage: BusinessHealthDataCoverage;
  evaluationPeriod: {
    start: string;
    end: string;
  };
  asOfTimestamp: string;
  businessTimezone: string;
  currencyCode: string;
  sourceFingerprint: string;
  applicableDimensionKeys: BusinessHealthDimensionKey[];
  dimensions: BusinessHealthDimensionResult[];
  strengthReasonKeys: BusinessHealthReasonKey[];
  attentionReasonKeys: BusinessHealthReasonKey[];
  actionKeys: BusinessHealthActionKey[];
  explanation?: BusinessHealthExplanation | null;
  isStale?: boolean;
}

export interface BusinessHealthScoreSnapshot extends BusinessHealthScoreResult {
  id: string;
  businessId: string;
  createdByUserId: string;
  createdAt: string;
}

export interface RefreshBusinessHealthScoreInput {
  idempotencyKey?: string;
}

export interface ExplainBusinessHealthScoreInput {
  snapshotId?: string;
}

// ============================================================================
// NNOO Credit Passport Contracts (T3-P07)
// ============================================================================

export type CreditPassportStatus = 'ready' | 'limited_history' | 'insufficient_data' | 'revoked';

export type CreditPassportDataCoverage = 'high' | 'medium' | 'low' | 'insufficient';

export type CreditPassportProvenanceType =
  | 'BUSINESS_PROFILE_PROVIDED'
  | 'NNOO_OPERATIONAL_RECORD'
  | 'NNOO_FINANCIAL_CALCULATION'
  | 'NNOO_HEALTH_SCORE'
  | 'EXTERNAL_VERIFICATION';

export type CreditPassportHighlightKey =
  | 'RECORDED_SALES_ACTIVITY'
  | 'POSITIVE_GROSS_PROFIT'
  | 'OPERATING_RESULT_POSITIVE'
  | 'RECEIVABLES_HEALTHY'
  | 'RECEIVABLES_PRESENT'
  | 'PAYABLES_CLEAN'
  | 'PAYABLES_PRESENT'
  | 'NO_OVERDUE_INVOICES'
  | 'OVERDUE_INVOICES_PRESENT'
  | 'INVENTORY_TRACKED'
  | 'INVENTORY_OPTIMAL'
  | 'LOW_STOCK_PRESENT'
  | 'HEALTH_SCORE_AVAILABLE'
  | 'LIMITED_RECORDED_HISTORY'
  | 'DATA_COVERAGE_HIGH'
  | 'DATA_COVERAGE_ESTABLISHED'
  | 'DATA_COVERAGE_EARLY'
  | 'DATA_COVERAGE_INSUFFICIENT';

export type CreditPassportAttentionKey =
  | 'EXPENSES_EXCEED_GROSS_PROFIT'
  | 'OVERDUE_INVOICES_ALERT'
  | 'ELEVATED_PAYABLES_ALERT'
  | 'OUT_OF_STOCK_ALERT'
  | 'LOW_STOCK_ALERT'
  | 'LIMITED_HISTORY_NOTICE'
  | 'INSUFFICIENT_DATA_NOTICE';

export interface CreditPassportBusinessIdentity {
  name: string;
  legalName: string | null;
  industry: string;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  city: string | null;
  state: string | null;
  registrationNumber: string | null;
  taxIdentifier: string | null;
  businessCreatedAt: string;
  provenance: CreditPassportProvenanceType;
}

export interface CreditPassportRecordedHistory {
  firstRecordedDate: string | null;
  lastRecordedDate: string | null;
  recordedDaysCount: number;
  provenance: CreditPassportProvenanceType;
}

export interface CreditPassportFinancialPerformance {
  periodStart: string;
  periodEnd: string;
  netSalesMinor: number;
  grossSalesMinor: number;
  salesCount: number;
  refundsCount: number;
  refundsTotalMinor: number;
  grossProfitMinor: number;
  operatingExpensesMinor: number;
  operatingResultMinor: number;
  provenance: CreditPassportProvenanceType;
}

export interface CreditPassportCurrentPosition {
  asOf: string;
  accountsReceivableMinor: number;
  accountsPayableMinor: number;
  inventoryValueMinor: number | null;
  overdueInvoicesCount: number;
  overdueInvoicesAmountMinor: number;
  provenance: CreditPassportProvenanceType;
}

export interface CreditPassportInvoiceActivity {
  totalInvoicesCount: number;
  paidInvoicesCount: number;
  pendingInvoicesCount: number;
  overdueInvoicesCount: number;
  provenance: CreditPassportProvenanceType;
}

export interface CreditPassportInventoryPosition {
  isApplicable: boolean;
  inventoryValueMinor: number | null;
  trackedItemsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  provenance: CreditPassportProvenanceType;
}

export interface CreditPassportHealthSummary {
  score: number | null;
  scoreBand: string | null;
  formulaVersion: string;
  dataCoverage: string;
  asOf: string;
  disclaimer: string;
  provenance: CreditPassportProvenanceType;
}

export interface CreditPassportDataCoverageSection {
  level: CreditPassportDataCoverage;
  recordedDays: number;
  hasSales: boolean;
  hasExpenses: boolean;
  hasInvoices: boolean;
  hasInventory: boolean;
  summaryText: string;
}

export interface CreditPassportExplanation {
  headline: string;
  overview: string;
  highlightKeys: CreditPassportHighlightKey[];
  attentionKeys: CreditPassportAttentionKey[];
  promptVersion: string;
  responseSchemaVersion: string;
  modelId: string;
  createdAt: string;
}

export interface CreditPassportPayload {
  passportSchemaVersion: string;
  businessIdentity: CreditPassportBusinessIdentity;
  passportPeriod: {
    start: string;
    end: string;
  };
  recordedHistory: CreditPassportRecordedHistory;
  financialPerformance: CreditPassportFinancialPerformance;
  currentPosition: CreditPassportCurrentPosition;
  invoiceActivity: CreditPassportInvoiceActivity;
  inventoryPosition: CreditPassportInventoryPosition;
  healthScore: CreditPassportHealthSummary;
  dataCoverage: CreditPassportDataCoverageSection;
  disclaimers: string[];
  asOfTimestamp: string;
  sourceFingerprint: string;
}

export interface CreditPassportSnapshot {
  id: string;
  businessId: string;
  passportCode: string;
  passportVersion: number;
  passportSchemaVersion: string;
  status: CreditPassportStatus;
  periodStart: string;
  periodEnd: string;
  asOfTimestamp: string;
  generatedByUserId: string;
  sourceFingerprint: string;
  artifactHash: string;
  dataCoverage: CreditPassportDataCoverage;
  payload: CreditPassportPayload;
  healthScoreSnapshotId: string | null;
  aiExplanation: CreditPassportExplanation | null;
  createdAt: string;
  isCurrent?: boolean;
}

export interface CreditPassportPreview {
  status: CreditPassportStatus;
  dataCoverage: CreditPassportDataCoverage;
  payload: CreditPassportPayload;
  sourceFingerprint: string;
  latestSnapshot?: CreditPassportSnapshot | null;
  isStale: boolean;
}

export interface GenerateCreditPassportInput {
  idempotencyKey?: string;
}

export interface CreateCreditPassportShareInput {
  snapshotId: string;
  expiresInDays?: number; // default 7, max 30
}

export interface CreditPassportShare {
  id: string;
  businessId: string;
  passportSnapshotId: string;
  passportCode: string;
  passportVersion: number;
  expiresAt: string;
  revokedAt: string | null;
  isExpired: boolean;
  isRevoked: boolean;
  accessCount: number;
  lastAccessedAt: string | null;
  createdAt: string;
  shareUrl?: string;
}

export interface CreditPassportExternalProjection {
  passportCode: string;
  passportVersion: number;
  generatedAt: string;
  asOf: string;
  status: CreditPassportStatus;
  artifactHash: string;
  businessIdentity: {
    name: string;
    legalName: string | null;
    industry: string;
    countryCode: string;
    currencyCode: string;
    city: string | null;
    state: string | null;
    registrationNumber: string | null;
    taxIdentifier: string | null;
    businessCreatedAt: string;
    provenance: CreditPassportProvenanceType;
  };
  recordedHistory: CreditPassportRecordedHistory;
  financialPerformance: CreditPassportFinancialPerformance;
  currentPosition: CreditPassportCurrentPosition;
  invoiceActivity: CreditPassportInvoiceActivity;
  inventoryPosition: CreditPassportInventoryPosition;
  healthScore: CreditPassportHealthSummary;
  dataCoverage: CreditPassportDataCoverageSection;
  disclaimers: string[];
  aiExplanation: {
    headline: string;
    overview: string;
  } | null;
}

export interface CreditPassportVerificationResult {
  isValid: boolean;
  passportCode: string;
  passportVersion: number;
  generatedAt: string;
  status: CreditPassportStatus;
  dataCoverage: CreditPassportDataCoverage;
  artifactHash: string;
  isIntegrityVerified: boolean;
  businessName: string;
  recordedPeriod: {
    start: string;
    end: string;
  };
}

export interface ExplainCreditPassportInput {
  snapshotId: string;
}

// ============================================================================
// T3-P08: Intelligence Jobs & Automation Foundation Contracts
// ============================================================================

export type AutomationType = 'business_summary' | 'health_score_refresh' | 'attention_scan';

export type AutomationFrequency = 'daily' | 'weekly' | 'monthly' | 'off';

export type AutomationRunStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'skipped'
  | 'cancelled';

export type AutomationJobType =
  | 'scheduled_business_summary'
  | 'scheduled_health_refresh'
  | 'scheduled_attention_scan'
  | 'manual_business_summary'
  | 'manual_health_refresh'
  | 'manual_attention_scan';

export type AutomationResultType =
  | 'summary_created'
  | 'summary_reused'
  | 'health_snapshot_created'
  | 'health_snapshot_reused'
  | 'attention_scan_completed'
  | 'skipped';

export type AutomationSkipReason =
  | 'AUTOMATION_DISABLED'
  | 'BUSINESS_RESTRICTED'
  | 'FEATURE_DISABLED'
  | 'AI_DISABLED'
  | 'SOURCE_UNCHANGED'
  | 'INSUFFICIENT_DATA'
  | 'STALE_SCHEDULE_VERSION'
  | 'UNAUTHORIZED';

export type BusinessAttentionType =
  | 'LOW_STOCK_PRESENT'
  | 'OUT_OF_STOCK_PRESENT'
  | 'OVERDUE_INVOICES_PRESENT'
  | 'BOOKKEEPER_REVIEW_PENDING'
  | 'CREDIT_PASSPORT_STALE'
  | 'HEALTH_SCORE_CHANGED'
  | 'AUTOMATION_JOB_FAILED';

export type BusinessAttentionCategory = 'STATEFUL' | 'OCCURRENCE';

export type BusinessAttentionSeverity = 'info' | 'attention' | 'important';

export type BusinessAttentionStatus = 'active' | 'resolved' | 'dismissed';

export interface BusinessAutomation {
  id: string;
  businessId: string;
  automationType: AutomationType;
  enabled: boolean;
  frequency: AutomationFrequency;
  scheduleLocalTime: string; // 'HH:MM' 24hr format
  scheduleWeekday: number | null; // 1 = Monday, 7 = Sunday
  scheduleMonthday: number | null; // 1 - 31
  configVersion: number;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntelligenceJobRun {
  id: string;
  businessId: string;
  automationId: string | null;
  jobType: AutomationJobType;
  idempotencyKey: string;
  status: AutomationRunStatus;
  scheduledFor: string | null;
  startedAt: string;
  completedAt: string | null;
  attemptCount: number;
  sourceFingerprint: string | null;
  resultType: AutomationResultType | null;
  resultId: string | null;
  providerInvocationId: string | null;
  errorCode: string | null;
  skipReason: AutomationSkipReason | null;
  correlationId: string | null;
  createdAt: string;
}

export interface BusinessAttentionEvent {
  id: string;
  businessId: string;
  type: BusinessAttentionType;
  category: BusinessAttentionCategory;
  dedupeKey: string;
  status: BusinessAttentionStatus;
  severity: BusinessAttentionSeverity;
  firstDetectedAt: string;
  lastDetectedAt: string;
  resolvedAt: string | null;
  sourceType: string;
  sourceReference: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAutomationInput {
  automationType: AutomationType;
  enabled: boolean;
  frequency: AutomationFrequency;
  scheduleLocalTime?: string;
  scheduleWeekday?: number | null;
  scheduleMonthday?: number | null;
}

export interface RunAutomationNowInput {
  automationType: AutomationType;
  idempotencyKey?: string;
}

export interface RunAutomationNowResult {
  jobRunId: string;
  status: AutomationRunStatus;
  resultType: AutomationResultType | null;
  resultId: string | null;
  skipReason: AutomationSkipReason | null;
  isReused?: boolean;
}

// ─── TRANCHE 3 PROMPT 9: NOTIFICATION & ATTENTION CENTER CONTRACTS ────────

export type NotificationCategory =
  | 'INVENTORY'
  | 'INVOICES'
  | 'BOOKKEEPER'
  | 'BUSINESS_HEALTH'
  | 'CREDIT_PASSPORT'
  | 'BUSINESS_SUMMARIES'
  | 'AUTOMATIONS';

export type NotificationType =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'OVERDUE_INVOICE'
  | 'BOOKKEEPER_REVIEW_PENDING'
  | 'BUSINESS_HEALTH_CHANGED'
  | 'CREDIT_PASSPORT_STALE'
  | 'BUSINESS_SUMMARY_READY'
  | 'AUTOMATION_FAILED';

export type NotificationChannel = 'IN_APP' | 'WHATSAPP' | 'PUSH';


export type NotificationActionKey =
  | 'OPEN_INVENTORY'
  | 'OPEN_INVOICES'
  | 'OPEN_AI_BOOKKEEPER'
  | 'OPEN_BUSINESS_HEALTH'
  | 'OPEN_CREDIT_PASSPORT'
  | 'OPEN_BUSINESS_INSIGHTS'
  | 'OPEN_AUTOMATIONS'
  | 'OPEN_AUTOMATION_HISTORY';

export interface BusinessNotification {
  id: string;
  businessId: string;
  recipientUserId: string;
  sourceEventId: string | null;
  notificationCategory: NotificationCategory;
  notificationType: NotificationType;
  dedupeKey: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  primaryActionKey: NotificationActionKey;
  sourceReferenceType: string | null;
  sourceReferenceId: string | null;
  requiredCapabilities: string[];
  channel: NotificationChannel;
  createdAt: string;
  readAt: string | null;
  resolvedAt: string | null;
}

export interface NotificationPreference {
  id: string;
  businessId: string;
  userId: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  updatedByUserId: string;
}

export interface BusinessAttentionItem {
  id: string;
  businessId: string;
  type: BusinessAttentionType;
  category: BusinessAttentionCategory;
  severity: BusinessAttentionSeverity;
  title: string;
  description: string;
  firstDetectedAt: string;
  lastDetectedAt: string;
  sourceType: string;
  sourceReference: string | null;
  primaryActionKey: NotificationActionKey;
  requiredCapabilities: string[];
  metadata: Record<string, unknown>;
}

export interface BusinessAttentionSummary {
  businessId: string;
  totalActiveCount: number;
  items: BusinessAttentionItem[];
  groupedByCategory: Record<NotificationCategory, BusinessAttentionItem[]>;
}

export interface NotificationFeedResponse {
  notifications: BusinessNotification[];
  totalUnreadCount: number;
  hasMore: boolean;
  nextCursor?: string | null;
}

export interface UnreadNotificationCountResponse {
  unreadCount: number;
}

export interface UpdateNotificationPreferenceInput {
  category: NotificationCategory;
  channel: NotificationChannel;
  enabled: boolean;
}

export interface MarkNotificationReadInput {
  notificationId: string;
}

export interface MarkAllNotificationsReadInput {
  businessId: string;
}

export const NOTIFICATION_ERROR_CODES = {
  NOTIFICATION_FORBIDDEN: 'NOTIFICATION_FORBIDDEN',
  NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
  NOTIFICATION_BUSINESS_RESTRICTED: 'NOTIFICATION_BUSINESS_RESTRICTED',
  NOTIFICATION_POLICY_NOT_FOUND: 'NOTIFICATION_POLICY_NOT_FOUND',
  NOTIFICATION_EVENT_INVALID: 'NOTIFICATION_EVENT_INVALID',
  NOTIFICATION_PREFERENCE_INVALID: 'NOTIFICATION_PREFERENCE_INVALID',
  NOTIFICATION_PREFERENCE_FORBIDDEN: 'NOTIFICATION_PREFERENCE_FORBIDDEN',
  NOTIFICATION_ALREADY_PROCESSED: 'NOTIFICATION_ALREADY_PROCESSED',
  NOTIFICATION_PROCESSING_FAILED: 'NOTIFICATION_PROCESSING_FAILED',
} as const;

export type NotificationErrorCode =
  (typeof NOTIFICATION_ERROR_CODES)[keyof typeof NOTIFICATION_ERROR_CODES];

// ============================================================================
// NNOO WhatsApp Business Integration Contracts (T3-P10)
// ============================================================================

export type WhatsAppConnectionStatus = 'PENDING' | 'ACTIVE' | 'OPTED_OUT' | 'REVOKED';
export type WhatsAppConsentStatus = 'CONSENTED' | 'OPTED_OUT' | 'REVOKED';
export type WhatsAppDeliveryStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'SKIPPED';
export type WhatsAppMessageType = 'template' | 'text';

export type WhatsAppInboundCommandType =
  | 'HELP'
  | 'STOP'
  | 'START'
  | 'BUSINESS'
  | 'SWITCH_BUSINESS'
  | 'ASK_NNOO'
  | 'CONNECT'
  | 'UNRECOGNIZED';

export interface WhatsAppConnection {
  id: string;
  businessId: string;
  userId: string;
  provider: string;
  providerPhoneNumberId: string;
  maskedPhone: string;
  status: WhatsAppConnectionStatus;
  consentStatus: WhatsAppConsentStatus;
  consentVersion: string;
  consentedAt: string;
  optedOutAt: string | null;
  linkedAt: string;
  revokedAt: string | null;
  activeBusinessContext: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppConnectionSummary {
  isConnected: boolean;
  status: WhatsAppConnectionStatus;
  maskedPhone: string | null;
  activeBusinessId: string;
  activeBusinessName?: string;
  linkedAt: string | null;
  availableBusinesses?: Array<{ id: string; name: string; slug: string; role: string; isActive: boolean }>;
}

export interface WhatsAppLinkRequest {
  id: string;
  businessId: string;
  userId: string;
  codeDisplay: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
}

export interface CreateWhatsAppLinkResult {
  code: string;
  expiresAt: string;
  qrPayload: string;
  clickToChatUrl: string;
}

export interface DisconnectWhatsAppResult {
  success: boolean;
  disconnectedAt: string;
}

export interface SwitchWhatsAppBusinessInput {
  targetBusinessId: string;
}

export interface WhatsAppDeliverySummary {
  id: string;
  notificationId: string | null;
  businessId: string;
  recipientUserId: string;
  status: WhatsAppDeliveryStatus;
  templateKey: string | null;
  renderedBody: string;
  queuedAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failedAt: string | null;
  errorCode: string | null;
}

export const WHATSAPP_ERROR_CODES = {
  WHATSAPP_UNAUTHENTICATED: 'WHATSAPP_UNAUTHENTICATED',
  WHATSAPP_FORBIDDEN: 'WHATSAPP_FORBIDDEN',
  WHATSAPP_NOT_CONFIGURED: 'WHATSAPP_NOT_CONFIGURED',
  WHATSAPP_INVALID_SIGNATURE: 'WHATSAPP_INVALID_SIGNATURE',
  WHATSAPP_INVALID_VERIFY_TOKEN: 'WHATSAPP_INVALID_VERIFY_TOKEN',
  WHATSAPP_LINK_EXPIRED: 'WHATSAPP_LINK_EXPIRED',
  WHATSAPP_LINK_INVALID: 'WHATSAPP_LINK_INVALID',
  WHATSAPP_LINK_RATE_LIMITED: 'WHATSAPP_LINK_RATE_LIMITED',
  WHATSAPP_ALREADY_CONNECTED: 'WHATSAPP_ALREADY_CONNECTED',
  WHATSAPP_CONNECTION_NOT_FOUND: 'WHATSAPP_CONNECTION_NOT_FOUND',
  WHATSAPP_PROVIDER_ERROR: 'WHATSAPP_PROVIDER_ERROR',
  WHATSAPP_DELIVERY_FAILED: 'WHATSAPP_DELIVERY_FAILED',
  WHATSAPP_OPTED_OUT: 'WHATSAPP_OPTED_OUT',
  WHATSAPP_MUTATION_NOT_PERMITTED: 'WHATSAPP_MUTATION_NOT_PERMITTED',
  WHATSAPP_BUSINESS_SWITCH_INVALID: 'WHATSAPP_BUSINESS_SWITCH_INVALID',
} as const;

export type WhatsAppErrorCode =
  (typeof WHATSAPP_ERROR_CODES)[keyof typeof WHATSAPP_ERROR_CODES];

// ==============================================================================
// PLATFORM ADMIN INTELLIGENCE OVERSIGHT CONTRACTS (Prompt 11)
// ==============================================================================

export type IntelligenceReportingPeriod = '24h' | '7d' | '30d';

export type IntelligenceSystemStatus = 'HEALTHY' | 'DEGRADED' | 'NOT_CONFIGURED' | 'UNAVAILABLE';

export interface AiProviderOperationalStatus {
  status: IntelligenceSystemStatus;
  isConfigured: boolean;
  configuredModel: string;
  activeEnvironment: string;
  totalInvocations: number;
  successfulInvocations: number;
  failedInvocations: number;
  timeoutCount: number;
  rateLimitedCount: number;
  averageLatencyMs: number;
  lastSuccessfulInvocationAt: string | null;
  lastFailureAt: string | null;
  lastFailureReason: string | null;
}

export interface AiModelRegistryEntry {
  featureKey: string;
  featureName: string;
  modelId: string;
  configVersion: string;
  status: 'ACTIVE' | 'EXPERIMENTAL' | 'DEPRECATED';
  inputPricePer1MTokensUsd: number;
  outputPricePer1MTokensUsd: number;
  lastUsedAt: string | null;
}

export interface AiPromptVersionEntry {
  featureKey: string;
  featureName: string;
  promptVersion: string;
  responseSchemaVersion: string;
  status: 'ACTIVE' | 'SUPERSEDED';
  isSourceControlled: boolean;
  description: string;
}

export interface AiFeatureUsageMetrics {
  featureKey: string;
  featureName: string;
  invocations: number;
  successful: number;
  failed: number;
  totalTokens: number;
  estimatedCostUsd: number | null;
  costLabel: 'Exact' | 'Estimated from configured pricing (USD)' | 'Unavailable';
  averageLatencyMs: number;
}

export interface AiOperationsMetrics {
  period: IntelligenceReportingPeriod;
  providerStatus: AiProviderOperationalStatus;
  totalInvocations: number;
  successfulInvocations: number;
  failedInvocations: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedTotalCostUsd: number | null;
  costLabel: 'Exact' | 'Estimated from configured pricing (USD)' | 'Unavailable';
  averageLatencyMs: number;
  features: AiFeatureUsageMetrics[];
  modelRegistry: AiModelRegistryEntry[];
  promptRegistry: AiPromptVersionEntry[];
  recentFailures: {
    id: string;
    featureKey: string;
    businessId: string | null;
    modelId: string;
    promptVersion: string;
    errorCode: string | null;
    latencyMs: number | null;
    createdAt: string;
  }[];
}

export interface BookkeeperOperationsMetrics {
  period: IntelligenceReportingPeriod;
  status: IntelligenceSystemStatus;
  totalClassifications: number;
  validClassifications: number;
  validationFailures: number;
  lowConfidenceCount: number;
  pendingReviewsCount: number;
  confirmedApplicationsCount: number;
  rejectedReviewsCount: number;
  lastClassificationAt: string | null;
}

export interface AskNnooOperationsMetrics {
  period: IntelligenceReportingPeriod;
  status: IntelligenceSystemStatus;
  totalConversations: number;
  totalRequests: number;
  successfulResponses: number;
  validationFailures: number;
  providerFailures: number;
  rateLimitedRequests: number;
  toolInvocations: {
    toolKey: string;
    count: number;
    successCount: number;
    failureCount: number;
  }[];
}

export interface HealthOperationsMetrics {
  period: IntelligenceReportingPeriod;
  status: IntelligenceSystemStatus;
  activeFormulaVersion: string;
  totalCalculations: number;
  readyCount: number;
  insufficientDataCount: number;
  calculationFailures: number;
  formulaRegistry: {
    version: string;
    status: 'ACTIVE' | 'SUPERSEDED';
    introducedAt: string;
    dimensionCount: number;
  }[];
}

export interface CreditPassportOperationsMetrics {
  period: IntelligenceReportingPeriod;
  status: IntelligenceSystemStatus;
  totalGenerated: number;
  generationFailures: number;
  pdfFailures: number;
  activeSharesCount: number;
  expiredSharesCount: number;
  revokedSharesCount: number;
  integrityVerificationFailures: number;
}

export interface AutomationOperationsMetrics {
  period: IntelligenceReportingPeriod;
  status: IntelligenceSystemStatus;
  enabledAutomationsCount: number;
  totalJobRuns: number;
  succeededRuns: number;
  failedRuns: number;
  skippedRuns: number;
  currentlyRunning: number;
  recentFailures: {
    id: string;
    businessId: string;
    jobType: string;
    attemptCount: number;
    errorCode: string | null;
    startedAt: string;
    completedAt: string | null;
  }[];
}

export interface NotificationOperationsMetrics {
  period: IntelligenceReportingPeriod;
  status: IntelligenceSystemStatus;
  sourceEventsProcessed: number;
  inAppNotificationsCreated: number;
  deduplicatedCount: number;
  permissionSkippedCount: number;
  preferenceSkippedCount: number;
  processingFailures: number;
}

export interface WhatsAppOperationsMetrics {
  period: IntelligenceReportingPeriod;
  status: IntelligenceSystemStatus;
  isProviderConfigured: boolean;
  webhookHealth: 'HEALTHY' | 'DEGRADED' | 'NOT_CONFIGURED';
  lastValidWebhookAt: string | null;
  invalidSignatureCount: number;
  activeConnectionsCount: number;
  optedOutConnectionsCount: number;
  messagesSent: number;
  messagesDelivered: number;
  messagesRead: number;
  messagesFailed: number;
  templateRegistry: {
    templateKey: string;
    providerTemplateName: string;
    category: string;
    status: 'APPROVED' | 'PENDING' | 'FALLBACK_TEXT_ONLY';
  }[];
  recentFailures: {
    id: string;
    businessId: string;
    templateKey: string | null;
    status: string;
    errorCode: string | null;
    failedAt: string | null;
  }[];
}

export interface IntelligenceAdminOverview {
  period: IntelligenceReportingPeriod;
  generatedAt: string;
  aiPlatform: {
    status: IntelligenceSystemStatus;
    totalRequests: number;
    successful: number;
    failed: number;
    model: string;
  };
  bookkeeper: {
    status: IntelligenceSystemStatus;
    totalClassifications: number;
    pendingReviews: number;
    validationFailures: number;
  };
  askNnoo: {
    status: IntelligenceSystemStatus;
    totalRequests: number;
    validationFailures: number;
  };
  businessHealth: {
    status: IntelligenceSystemStatus;
    activeFormula: string;
    totalCalculations: number;
    insufficientData: number;
    failures: number;
  };
  creditPassport: {
    status: IntelligenceSystemStatus;
    totalGenerated: number;
    generationFailures: number;
    activeShares: number;
  };
  automations: {
    status: IntelligenceSystemStatus;
    succeeded: number;
    failed: number;
    skipped: number;
  };
  notifications: {
    status: IntelligenceSystemStatus;
    inAppCreated: number;
    deduplicated: number;
    preferenceSkipped: number;
  };
  whatsapp: {
    status: IntelligenceSystemStatus;
    activeConnections: number;
    sent: number;
    delivered: number;
    failed: number;
  };
}

export interface PlatformFeatureControl {
  id: string;
  featureKey: string;
  enabled: boolean;
  description: string;
  updatedByAdminId: string | null;
  updatedReason: string | null;
  updatedAt: string;
}

export interface UpdatePlatformFeatureControlInput {
  featureKey: string;
  enabled: boolean;
  reason: string;
}

export interface RetryFailedJobInput {
  jobRunId: string;
  reason: string;
}

export interface RetryFailedJobResult {
  success: boolean;
  jobRunId: string;
  newJobRunId?: string;
  status: string;
  message: string;
}

export interface RetryFailedWhatsAppDeliveryInput {
  deliveryId: string;
  reason: string;
}

export interface RetryFailedWhatsAppDeliveryResult {
  success: boolean;
  deliveryId: string;
  status: string;
  message: string;
}

export const ADMIN_INTELLIGENCE_ERROR_CODES = {
  ADMIN_UNAUTHENTICATED: 'ADMIN_UNAUTHENTICATED',
  ADMIN_FORBIDDEN: 'ADMIN_FORBIDDEN',
  ADMIN_INVALID_FILTER: 'ADMIN_INVALID_FILTER',
  ADMIN_FEATURE_CONTROL_INVALID: 'ADMIN_FEATURE_CONTROL_INVALID',
  ADMIN_REASON_REQUIRED: 'ADMIN_REASON_REQUIRED',
  ADMIN_JOB_NOT_FOUND: 'ADMIN_JOB_NOT_FOUND',
  ADMIN_JOB_NOT_RETRYABLE: 'ADMIN_JOB_NOT_RETRYABLE',
  ADMIN_JOB_RETRY_FAILED: 'ADMIN_JOB_RETRY_FAILED',
  ADMIN_DELIVERY_NOT_FOUND: 'ADMIN_DELIVERY_NOT_FOUND',
  ADMIN_DELIVERY_NOT_RETRYABLE: 'ADMIN_DELIVERY_NOT_RETRYABLE',
  ADMIN_DELIVERY_RETRY_BLOCKED: 'ADMIN_DELIVERY_RETRY_BLOCKED',
  ADMIN_INTERNAL_ERROR: 'ADMIN_INTERNAL_ERROR',
} as const;

export type AdminIntelligenceErrorCode =
  (typeof ADMIN_INTELLIGENCE_ERROR_CODES)[keyof typeof ADMIN_INTELLIGENCE_ERROR_CODES];

// ==============================================================================
// Mobile & Push Notification Contracts (Tranche 3 Prompt 12)
// ==============================================================================

export type PushProvider = 'EXPO' | 'FCM' | 'APNS';
export type PushDeviceStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';
export type PushPermissionState = 'GRANTED' | 'DENIED' | 'UNDETERMINED';

export interface MobilePushDevice {
  id: string;
  userId: string;
  installationId: string;
  provider: PushProvider;
  pushToken: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string | null;
  environment: string;
  status: PushDeviceStatus;
  permissionState: PushPermissionState;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}

export interface RegisterPushDeviceInput {
  installationId: string;
  pushToken: string;
  platform: 'ios' | 'android' | 'web';
  provider?: PushProvider;
  appVersion?: string;
  permissionState?: PushPermissionState;
}

export interface RevokePushDeviceInput {
  installationId: string;
}

export type PushDeliveryStatus = 'QUEUED' | 'SENT' | 'FAILED' | 'SKIPPED';

export interface MobilePushDelivery {
  id: string;
  businessId: string;
  notificationId: string;
  recipientUserId: string;
  deviceId: string | null;
  idempotencyKey: string;
  status: PushDeliveryStatus;
  providerTicketId: string | null;
  providerReceiptStatus: string | null;
  errorCode: string | null;
  renderedTitle: string;
  renderedBody: string;
  sentAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverPushNotificationResult {
  status: 'SENT' | 'SKIPPED' | 'FAILED';
  deliveryId?: string;
  providerTicketId?: string;
  skipReason?: string;
  error?: string;
}

export type MobileActionKey =
  | 'OPEN_AI_BOOKKEEPER'
  | 'OPEN_SMART_INSIGHTS'
  | 'OPEN_ASK_NNOO'
  | 'OPEN_BUSINESS_HEALTH'
  | 'OPEN_CREDIT_PASSPORT'
  | 'OPEN_AUTOMATIONS'
  | 'OPEN_NOTIFICATIONS'
  | 'OPEN_INVENTORY'
  | 'OPEN_INVOICES'
  | 'OPEN_SALES'
  | 'OPEN_EXPENSES'
  | 'OPEN_WHATSAPP_SETTINGS';

export const MOBILE_ACTION_ROUTE_MAP: Record<MobileActionKey, string> = {
  OPEN_AI_BOOKKEEPER: '/(app)/intelligence/bookkeeper',
  OPEN_SMART_INSIGHTS: '/(app)/intelligence/insights',
  OPEN_ASK_NNOO: '/(app)/intelligence/assistant',
  OPEN_BUSINESS_HEALTH: '/(app)/intelligence/health',
  OPEN_CREDIT_PASSPORT: '/(app)/intelligence/passport',
  OPEN_AUTOMATIONS: '/(app)/intelligence/automations',
  OPEN_NOTIFICATIONS: '/(app)/notifications',
  OPEN_INVENTORY: '/(app)/inventory',
  OPEN_INVOICES: '/(app)/invoices',
  OPEN_SALES: '/(app)/sales',
  OPEN_EXPENSES: '/(app)/more/expenses',
  OPEN_WHATSAPP_SETTINGS: '/(app)/settings/whatsapp',
};

export const PUSH_NOTIFICATION_ERROR_CODES = {
  PUSH_UNAUTHENTICATED: 'PUSH_UNAUTHENTICATED',
  PUSH_FORBIDDEN: 'PUSH_FORBIDDEN',
  PUSH_DEVICE_INVALID: 'PUSH_DEVICE_INVALID',
  PUSH_TOKEN_INVALID: 'PUSH_TOKEN_INVALID',
  PUSH_DEVICE_NOT_FOUND: 'PUSH_DEVICE_NOT_FOUND',
  PUSH_DELIVERY_FAILED: 'PUSH_DELIVERY_FAILED',
  PUSH_DELIVERY_BLOCKED: 'PUSH_DELIVERY_BLOCKED',
  PUSH_PREFERENCE_MUTED: 'PUSH_PREFERENCE_MUTED',
  PUSH_RECIPIENT_INELIGIBLE: 'PUSH_RECIPIENT_INELIGIBLE',
  PUSH_BUSINESS_SUSPENDED: 'PUSH_BUSINESS_SUSPENDED',
} as const;

export type PushNotificationErrorCode =
  (typeof PUSH_NOTIFICATION_ERROR_CODES)[keyof typeof PUSH_NOTIFICATION_ERROR_CODES];




