# API and Data Contract Rules

Store request, response, event, error, and pagination contracts in `packages/contracts`. Validate runtime data through `packages/validation`.

## Versioning

- Server routes begin under `/api/v1`.
- Add fields compatibly where possible.
- Do not repurpose an existing field.
- Deprecate before removal.
- Breaking changes require a new version or approved coordinated release.

## Error contract

Return a stable code, safe message, optional field details, and a correlation identifier where useful. Never return secrets, stack traces, SQL, or private provider payloads to clients.

## Idempotency

Required for payment processing, webhooks, background retries, duplicate-prone sensitive creates, and mobile retry flows.

Business ownership is always derived from authenticated membership, not an unverified client claim.

## AI Foundation Contracts (Tranche 3)

The following shared TypeScript contracts live in `packages/contracts/ai.ts` and runtime Zod schemas in `packages/validation/ai.ts`:

- `AIFeatureKey`: `'ai.foundation.smoke' | 'ai.bookkeeper.classify' | 'ai.bookkeeper.explain' | 'ai.summary.business' | 'ai.ask_nnoo' | 'ai.health.explain' | 'ai.credit_passport.explain'`
- `AIInvocationStatus`: `'pending' | 'succeeded' | 'failed' | 'blocked' | 'timeout' | 'rate_limited'`
- `AIErrorCode`: Normalized safe error codes (`AI_CONFIGURATION_UNAVAILABLE`, `AI_FEATURE_DISABLED`, `AI_FORBIDDEN`, `AI_BUSINESS_RESTRICTED`, `AI_INVALID_INPUT`, `AI_CONTEXT_TOO_LARGE`, `AI_RATE_LIMITED`, `AI_PROVIDER_RATE_LIMITED`, `AI_PROVIDER_UNAVAILABLE`, `AI_PROVIDER_TIMEOUT`, `AI_MODEL_UNAVAILABLE`, `AI_RESPONSE_INVALID`, `AI_RESPONSE_BLOCKED`, `AI_TOOL_NOT_ALLOWED`, `AI_TOOL_INPUT_INVALID`, `AI_TOOL_FORBIDDEN`, `AI_INTERNAL_ERROR`, `AI_BOOKKEEPER_INVALID_INPUT`, `AI_BOOKKEEPER_FORBIDDEN`, `AI_BOOKKEEPER_CLASSIFICATION_FAILED`, `AI_BOOKKEEPER_INVALID_RESULT`, `AI_BOOKKEEPER_CANDIDATE_STALE`, `AI_BOOKKEEPER_IDEMPOTENCY_CONFLICT`, `AI_BOOKKEEPER_SOURCE_NOT_FOUND`, `AI_BOOKKEEPER_BUSINESS_RESTRICTED`)
- `AIUsageMetadata`: `{ inputTokens?: number; outputTokens?: number; totalTokens?: number }`
- `AISafeError`: `{ code: AIErrorCode; message: string; retryable: boolean; details?: Record<string, unknown> }`
- `VerifiedFactEnvelope<T>`: `{ schemaVersion: string; businessId?: string; generatedAt: string; source: string; data: T }`
- `FoundationSmokeResponse`: `{ status: 'ok'; message: string; echoFact?: string; timestamp: string }`
- `AIInvocationRecord`: Persistent audit metadata contract matching `public.ai_invocations` table.

## AI Bookkeeper Contracts (Tranche 3 Prompt 2)

- `BookkeepingOperationKind`: `'OPERATING_EXPENSE' | 'STOCK_PURCHASE' | 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT' | 'SALE' | 'REFUND' | 'UNKNOWN' | 'UNSUPPORTED'`
- `BookkeepingTransactionDirection`: `'MONEY_IN' | 'MONEY_OUT' | 'UNKNOWN'`
- `BookkeepingConfidenceBand`: `'HIGH' | 'MEDIUM' | 'LOW'`
- `BookkeepingMissingField`: `'AMOUNT_REQUIRED' | 'CUSTOMER_REQUIRED' | 'SUPPLIER_REQUIRED' | 'PAYABLE_SELECTION_REQUIRED' | 'SALE_SELECTION_REQUIRED' | 'PRODUCT_LINES_REQUIRED' | 'PAYMENT_METHOD_REQUIRED' | 'REFERENCE_RECOMMENDED' | 'CATEGORY_REVIEW_REQUIRED'`
- `BookkeepingWarningCode`: `'AMBIGUOUS_DESCRIPTION' | 'POSSIBLE_DUPLICATE' | 'COUNTERPARTY_NOT_MATCHED' | 'MULTIPLE_COUNTERPARTY_MATCHES' | 'UNSUPPORTED_OPERATION' | 'DIRECTION_CONFLICT' | 'CATEGORY_NOT_CONFIDENT' | 'INSUFFICIENT_INFORMATION'`
- `BookkeepingCategoryCandidate`: `{ candidateKey: string; name: string; systemKey?: string | null }`
- `BookkeepingSupplierCandidate`: `{ candidateKey: string; displayName: string }`
- `BookkeepingCustomerCandidate`: `{ candidateKey: string; displayName: string }`
- `BookkeepingDuplicateCandidate`: `{ candidateKey: string; occurredAt: string; amountMinor: number; reference?: string | null; operationType: string; counterpartyName?: string | null }`
- `BookkeepingClassificationInput`: `{ businessId?: string; description: string; amountMinor?: number | null; currencyCode?: string; transactionDirection?: BookkeepingTransactionDirection | null; transactionDate?: string | null; paymentMethod?: string | null; reference?: string | null; counterpartyText?: string | null; idempotencyKey?: string | null }`
- `BookkeepingStructuredOutput`: Raw Gemini response schema selecting opaque candidate keys only.
- `BookkeepingClassificationResult`: Persistent suggestion contract matching `public.ai_bookkeeping_classifications` with `requiresHumanReview: true`.
- `ReclassifyBookkeepingInput`: `{ classificationId: string; modifiedDescription?: string; modifiedAmountMinor?: number | null; modifiedDirection?: BookkeepingTransactionDirection | null; idempotencyKey?: string | null }`
- `POST /api/v1/ai/bookkeeper/classify`: Server endpoint for transaction understanding and candidate matching.
