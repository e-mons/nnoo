import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AskNnooConversation,
  AskNnooConversationSummary,
  AskNnooMessage,
  AskNnooRenderedPayload,
  AskNnooFactReference,
  AskNnooEntityReference,
  AskNnooSourceKey,
  AskNnooActionKey,
  AskNnooToolKey,
  StructuredAskNnooResponse,
  SendAskNnooMessageInput,
  SendAskNnooMessageResult,
} from '@nnoo/contracts';
import { StructuredAskNnooResponseSchema } from '@nnoo/validation';
import { AIApplicationService, AISafeError } from '../service';
import { type GeminiClientInterface } from '../gemini/client';
import { AskNnooToolExecutor, type ToolExecutionOutput } from './tools/executor';
import { AskNnooNumericGuard } from './numeric-guard';
import { ASK_NNOO_ACTION_REGISTRY } from '@nnoo/contracts';
import { ASK_NNOO_TOOLS } from './tools/registry';

export interface ProcessMessageOptions extends SendAskNnooMessageInput {
  supabase: SupabaseClient;
  businessId: string;
  userId: string;
  userRole: string;
  currencyCode?: string;
  timezone?: string;
  geminiClient?: GeminiClientInterface;
}

interface DbConversationRow {
  id: string;
  business_id: string;
  owner_user_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

interface DbMessageRow {
  id: string;
  conversation_id: string;
  business_id: string;
  owner_user_id: string;
  role: string;
  user_text: string | null;
  assistant_response_payload: AskNnooRenderedPayload | null;
  source_keys: AskNnooSourceKey[];
  required_capabilities: string[];
  created_at: string;
}

function userHasCapability(userRole: string, capability: string): boolean {
  const isOwnerOrAdmin = ['owner', 'business_admin', 'manager'].includes(userRole);
  const isAccountant = userRole === 'accountant';
  const isSalesStaff = userRole === 'sales_staff';
  const isInventoryStaff = userRole === 'inventory_staff';
  const isReadOnly = userRole === 'read_only';

  if (capability.includes('profitability') || capability.includes('reports.view')) {
    return isOwnerOrAdmin || isAccountant;
  }
  if (capability.includes('sales.view')) {
    return isOwnerOrAdmin || isAccountant || isSalesStaff || isReadOnly;
  }
  if (capability.includes('expenses.view')) {
    return isOwnerOrAdmin || isAccountant || isReadOnly;
  }
  if (capability.includes('inventory.view') || capability.includes('products.view')) {
    return isOwnerOrAdmin || isInventoryStaff || isReadOnly;
  }
  if (capability.includes('invoices.view')) {
    return isOwnerOrAdmin || isAccountant || isSalesStaff || isReadOnly;
  }
  if (capability.includes('bookkeeper.view')) {
    return isOwnerOrAdmin || isAccountant;
  }
  if (capability.includes('customers.view')) {
    return isOwnerOrAdmin || isSalesStaff || isAccountant || isReadOnly;
  }
  return isOwnerOrAdmin;
}

/**
 * Production Application Service for Ask NNOO Business AI Assistant.
 * Coordinates conversation persistence, tool selection and bounded execution,
 * fact substitution, and historical role-downgrade reauthorization.
 */
export class AskNnooAssistantService {
  /**
   * Lists active conversations for the authenticated user in the active business.
   * Requires 0 Gemini API calls.
   */
  public static async listConversations(
    supabase: SupabaseClient,
    businessId: string,
    userId: string,
    limit: number = 20
  ): Promise<AskNnooConversationSummary[]> {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('id, title, status, last_message_at')
      .eq('business_id', businessId)
      .eq('owner_user_id', userId)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new AISafeError('AI_INTERNAL_ERROR', `Failed to list conversations: ${error.message}`, false);
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status as any,
      lastMessageAt: row.last_message_at,
    }));
  }

  /**
   * Creates a new conversation.
   * Requires 0 Gemini API calls.
   */
  public static async createConversation(
    supabase: SupabaseClient,
    businessId: string,
    userId: string,
    initialTitle: string = 'New Conversation'
  ): Promise<AskNnooConversation> {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        business_id: businessId,
        owner_user_id: userId,
        title: initialTitle.slice(0, 80),
        status: 'active',
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new AISafeError('AI_INTERNAL_ERROR', `Failed to create conversation: ${error?.message}`, false);
    }

    const row = data as DbConversationRow;
    return {
      id: row.id,
      businessId: row.business_id,
      ownerUserId: row.owner_user_id,
      title: row.title,
      status: row.status as any,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastMessageAt: row.last_message_at,
    };
  }

  /**
   * Retrieves conversation detail and all messages.
   * Enforces Role Downgrade Security: Masks privileged historical responses
   * if the current user role no longer possesses required capabilities.
   * Requires 0 Gemini API calls.
   */
  public static async getConversation(
    supabase: SupabaseClient,
    businessId: string,
    userId: string,
    userRole: string,
    conversationId: string
  ): Promise<{ conversation: AskNnooConversation; messages: AskNnooMessage[] }> {
    // 1. Fetch conversation
    const { data: convData, error: convError } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('business_id', businessId)
      .eq('owner_user_id', userId)
      .single();

    if (convError || !convData) {
      throw new AISafeError(
        'ASK_NNOO_CONVERSATION_NOT_FOUND',
        'Conversation not found or access is denied.',
        false
      );
    }

    // 2. Fetch messages
    const { data: msgData, error: msgError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('business_id', businessId)
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: true });

    if (msgError) {
      throw new AISafeError('AI_INTERNAL_ERROR', `Failed to fetch messages: ${msgError.message}`, false);
    }

    const conv = convData as DbConversationRow;
    const messages: AskNnooMessage[] = (msgData || []).map((m: any) => {
      const row = m as DbMessageRow;
      let payload = row.assistant_response_payload;

      // Role Downgrade Verification
      if (row.role === 'assistant' && payload && row.required_capabilities?.length > 0) {
        const hasAllCaps = row.required_capabilities.every((cap) => userHasCapability(userRole, cap));
        if (!hasAllCaps) {
          payload = {
            schemaVersion: '1.0.0',
            responseType: 'FORBIDDEN',
            headline: 'This earlier response is no longer available because your Business permissions have changed.',
            segments: [
              {
                type: 'TEXT',
                text: 'This earlier response is no longer available because your Business permissions have changed.',
              },
            ],
            facts: [],
            entities: [],
            sourceKeys: [],
            actionKeys: [],
            followUpQuestions: [],
            isRedactedByRoleDowngrade: true,
          };
        }
      }

      return {
        id: row.id,
        conversationId: row.conversation_id,
        businessId: row.business_id,
        ownerUserId: row.owner_user_id,
        role: row.role as any,
        userText: row.user_text,
        assistantResponsePayload: payload,
        sourceKeys: row.source_keys || [],
        requiredCapabilities: row.required_capabilities || [],
        createdAt: row.created_at,
      };
    });

    return {
      conversation: {
        id: conv.id,
        businessId: conv.business_id,
        ownerUserId: conv.owner_user_id,
        title: conv.title,
        status: conv.status as any,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        lastMessageAt: conv.last_message_at,
        messageCount: messages.length,
      },
      messages,
    };
  }

  /**
   * Archives a conversation.
   */
  public static async archiveConversation(
    supabase: SupabaseClient,
    businessId: string,
    userId: string,
    conversationId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('ai_conversations')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('business_id', businessId)
      .eq('owner_user_id', userId);

    if (error) {
      throw new AISafeError('AI_INTERNAL_ERROR', `Failed to archive conversation: ${error.message}`, false);
    }
  }

  /**
   * Detects intent and selects appropriate read-only tools.
   */
  private static determineToolsToCall(userQuery: string): { tools: AskNnooToolKey[]; period?: string } {
    const q = userQuery.toLowerCase();

    // 1. Sales queries
    if (q.includes('sell') || q.includes('sale') || q.includes('revenue') || q.includes('gross sales')) {
      let period = 'this_month';
      if (q.includes('today')) period = 'today';
      else if (q.includes('this week') || q.includes('week')) period = 'this_week';
      else if (q.includes('this month') || q.includes('month')) period = 'this_month';
      return { tools: ['getSalesSummary'], period };
    }

    // 2. Profitability queries
    if (q.includes('profit') || q.includes('cogs') || q.includes('cost of goods') || q.includes('margin') || q.includes('operating result')) {
      let period = 'this_month';
      if (q.includes('today')) period = 'today';
      else if (q.includes('week')) period = 'this_week';
      return { tools: ['getProfitabilitySummary'], period };
    }

    // 3. Expense queries
    if (q.includes('expense') || q.includes('spend') || q.includes('bills') || q.includes('cost')) {
      let period = 'this_month';
      if (q.includes('today')) period = 'today';
      else if (q.includes('week')) period = 'this_week';
      return { tools: ['getExpenseSummary'], period };
    }

    // 4. Receivables queries
    if (q.includes('owe me') || q.includes('owing') || q.includes('receivable') || q.includes('debtor') || q.includes('customer balance')) {
      return { tools: ['getReceivablesSummary'] };
    }

    // 5. Payables queries
    if (q.includes('i owe') || q.includes('we owe') || q.includes('payable') || q.includes('creditor') || q.includes('supplier balance')) {
      return { tools: ['getPayablesSummary'] };
    }

    // 6. Inventory & Stock queries
    if (q.includes('stock') || q.includes('inventory') || q.includes('item') || q.includes('product count') || q.includes('low')) {
      return { tools: ['getInventoryStatus'] };
    }

    // 7. Invoice queries
    if (q.includes('invoice') || q.includes('overdue')) {
      return { tools: ['getInvoiceStatus'] };
    }

    // 8. Bookkeeper queries
    if (q.includes('bookkeeper') || q.includes('review') || q.includes('waiting')) {
      return { tools: ['getBookkeeperStatus'] };
    }

    // 9. Overview / General Performance queries
    if (q.includes('how am i doing') || q.includes('overview') || q.includes('summary') || q.includes('business doing') || q.includes('attention')) {
      return { tools: ['getBusinessOverview'] };
    }

    // Default to Business Overview
    return { tools: ['getBusinessOverview'] };
  }

  /**
   * Detects mutation intent from user message.
   */
  private static detectMutationIntent(userQuery: string): { isMutation: boolean; actionKey: AskNnooActionKey; reason: string } {
    const q = userQuery.toLowerCase().trim();

    if (
      q.startsWith('record ') ||
      q.startsWith('create ') ||
      q.startsWith('add ') ||
      q.startsWith('log ') ||
      q.startsWith('post ') ||
      q.startsWith('refund ') ||
      q.startsWith('mark ') ||
      q.startsWith('pay ') ||
      q.startsWith('delete ')
    ) {
      if (q.includes('expense') || q.includes('fuel') || q.includes('rent') || q.includes('salary') || q.includes('repair')) {
        return {
          isMutation: true,
          actionKey: 'OPEN_AI_BOOKKEEPER',
          reason: "I cannot record expenses directly through Ask NNOO. You can record and categorize this expense using NNOO's AI Bookkeeper or the Record Expense workflow.",
        };
      }
      if (q.includes('sale') || q.includes('sold')) {
        return {
          isMutation: true,
          actionKey: 'CREATE_SALE',
          reason: "I cannot create sales transactions directly through Ask NNOO. Please use NNOO's secure Create Sale screen.",
        };
      }
      if (q.includes('refund')) {
        return {
          isMutation: true,
          actionKey: 'OPEN_SALES_REPORT',
          reason: "I cannot process refunds directly through Ask NNOO. Refunds must be confirmed securely against the original sale in the Sales Report.",
        };
      }
      if (q.includes('payment') || q.includes('paid')) {
        return {
          isMutation: true,
          actionKey: 'OPEN_RECEIVABLES',
          reason: "I cannot record payments directly through Ask NNOO. Please open the relevant invoice or sale to record verified customer payments.",
        };
      }
      if (q.includes('product') || q.includes('stock')) {
        return {
          isMutation: true,
          actionKey: 'OPEN_INVENTORY',
          reason: "I cannot add products or adjust stock quantities directly through Ask NNOO. Please use the Inventory management module.",
        };
      }
    }

    return { isMutation: false, actionKey: 'OPEN_SALES_REPORT', reason: '' };
  }

  /**
   * Processes a user question turn within a conversation.
   */
  public static async processMessage(options: ProcessMessageOptions): Promise<SendAskNnooMessageResult> {
    const {
      supabase,
      businessId,
      userId,
      userRole,
      currencyCode = 'NGN',
      timezone = 'Africa/Lagos',
      message,
      idempotencyKey,
      geminiClient,
    } = options;

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      throw new AISafeError('ASK_NNOO_INVALID_MESSAGE', 'Message cannot be empty.', false);
    }

    // 1. Resolve or create conversation
    let convId = options.conversationId;
    if (!convId) {
      const newConv = await this.createConversation(supabase, businessId, userId, trimmedMessage.slice(0, 50));
      convId = newConv.id;
    } else {
      const { data: convCheck } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('id', convId)
        .eq('business_id', businessId)
        .eq('owner_user_id', userId)
        .single();

      if (!convCheck) {
        throw new AISafeError('ASK_NNOO_CONVERSATION_NOT_FOUND', 'Conversation not found or access denied.', false);
      }
    }

    // 2. Turn Idempotency: Check if the exact user turn already completed
    const { data: existingMsg } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', convId)
      .eq('business_id', businessId)
      .eq('owner_user_id', userId)
      .eq('user_text', trimmedMessage)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingMsg && existingMsg.assistant_response_payload) {
      const userMsg: AskNnooMessage = {
        id: `user-${existingMsg.id}`,
        conversationId: convId,
        businessId,
        ownerUserId: userId,
        role: 'user',
        userText: trimmedMessage,
        assistantResponsePayload: null,
        sourceKeys: [],
        requiredCapabilities: [],
        createdAt: existingMsg.created_at,
      };
      const assistantMsg: AskNnooMessage = {
        id: existingMsg.id,
        conversationId: convId,
        businessId,
        ownerUserId: userId,
        role: 'assistant',
        userText: null,
        assistantResponsePayload: existingMsg.assistant_response_payload,
        sourceKeys: existingMsg.source_keys || [],
        requiredCapabilities: existingMsg.required_capabilities || [],
        createdAt: existingMsg.created_at,
      };
      return { conversationId: convId, userMessage: userMsg, assistantMessage: assistantMsg };
    }

    // 3. Mutation Intent Check (Zero Autonomous Side Effects)
    const mutation = this.detectMutationIntent(trimmedMessage);
    if (mutation.isMutation) {
      const renderedPayload: AskNnooRenderedPayload = {
        schemaVersion: '1.0.0',
        responseType: 'MUTATION_REQUIRES_WORKFLOW',
        headline: 'Direct changes require secure confirmation',
        segments: [
          {
            type: 'TEXT',
            text: mutation.reason,
          },
        ],
        facts: [],
        entities: [],
        sourceKeys: [],
        actionKeys: [mutation.actionKey],
        followUpQuestions: [],
      };

      // Persist user and assistant messages
      const [userInsertRes, assistInsertRes] = await Promise.all([
        supabase
          .from('ai_messages')
          .insert({
            conversation_id: convId,
            business_id: businessId,
            owner_user_id: userId,
            role: 'user',
            user_text: trimmedMessage,
            source_keys: [],
            required_capabilities: [],
          })
          .select('*')
          .single(),
        supabase
          .from('ai_messages')
          .insert({
            conversation_id: convId,
            business_id: businessId,
            owner_user_id: userId,
            role: 'assistant',
            assistant_response_payload: renderedPayload,
            source_keys: [],
            required_capabilities: [],
            model_id: 'deterministic-rules',
          })
          .select('*')
          .single(),
      ]);

      await supabase
        .from('ai_conversations')
        .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', convId);

      const userRow = userInsertRes.data as DbMessageRow;
      const assistRow = assistInsertRes.data as DbMessageRow;

      return {
        conversationId: convId,
        userMessage: {
          id: userRow.id,
          conversationId: convId,
          businessId,
          ownerUserId: userId,
          role: 'user',
          userText: userRow.user_text,
          assistantResponsePayload: null,
          sourceKeys: [],
          requiredCapabilities: [],
          createdAt: userRow.created_at,
        },
        assistantMessage: {
          id: assistRow.id,
          conversationId: convId,
          businessId,
          ownerUserId: userId,
          role: 'assistant',
          userText: null,
          assistantResponsePayload: assistRow.assistant_response_payload,
          sourceKeys: [],
          requiredCapabilities: [],
          createdAt: assistRow.created_at,
        },
      };
    }

    // 4. Fetch recent conversation context (last 6 messages)
    const { data: recentHistory } = await supabase
      .from('ai_messages')
      .select('role, user_text, assistant_response_payload')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(6);

    const historyTurns = (recentHistory || [])
      .reverse()
      .map((h: any) => {
        if (h.role === 'user') {
          return `User: ${h.user_text}`;
        }
        return `Assistant: ${h.assistant_response_payload?.headline || 'Business overview answer'}`;
      })
      .join('\n');

    // 5. Select and execute tools
    const toolPlan = this.determineToolsToCall(trimmedMessage);
    const toolCtx = { supabase, businessId, userId, userRole, currencyCode, timezone };

    const executedTools: ToolExecutionOutput[] = [];
    const factsMap = new Map<string, AskNnooFactReference>();
    const entitiesMap = new Map<string, AskNnooEntityReference>();
    const sourceKeysSet = new Set<AskNnooSourceKey>();
    const actionKeysSet = new Set<AskNnooActionKey>();
    const requiredCapsSet = new Set<string>();

    let isPermissionDenied = false;
    let deniedErrorMessage = '';

    for (const toolName of toolPlan.tools) {
      try {
        const out = await AskNnooToolExecutor.executeTool(toolName, { period: toolPlan.period }, toolCtx);
        executedTools.push(out);
        sourceKeysSet.add(out.sourceKey);
        actionKeysSet.add(out.defaultActionKey);
        requiredCapsSet.add(out.requiredCapability);

        out.facts.forEach((f) => factsMap.set(f.key, f));
        out.entities.forEach((e) => entitiesMap.set(e.key, e));
      } catch (err: any) {
        if (err.code === 'ASK_NNOO_FORBIDDEN') {
          isPermissionDenied = true;
          deniedErrorMessage = err.message || 'You do not have permission to view this financial information.';
          break;
        }
        throw err;
      }
    }

    // 6. Handle Permission Denial gracefully
    if (isPermissionDenied) {
      const renderedPayload: AskNnooRenderedPayload = {
        schemaVersion: '1.0.0',
        responseType: 'FORBIDDEN',
        headline: 'Access restricted by business role',
        segments: [
          {
            type: 'TEXT',
            text: deniedErrorMessage,
          },
        ],
        facts: [],
        entities: [],
        sourceKeys: [],
        actionKeys: [],
        followUpQuestions: [],
      };

      const [userInsertRes, assistInsertRes] = await Promise.all([
        supabase
          .from('ai_messages')
          .insert({
            conversation_id: convId,
            business_id: businessId,
            owner_user_id: userId,
            role: 'user',
            user_text: trimmedMessage,
            source_keys: [],
            required_capabilities: [],
          })
          .select('*')
          .single(),
        supabase
          .from('ai_messages')
          .insert({
            conversation_id: convId,
            business_id: businessId,
            owner_user_id: userId,
            role: 'assistant',
            assistant_response_payload: renderedPayload,
            source_keys: [],
            required_capabilities: Array.from(requiredCapsSet),
            model_id: 'deterministic-rules',
          })
          .select('*')
          .single(),
      ]);

      await supabase
        .from('ai_conversations')
        .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', convId);

      const userRow = userInsertRes.data as DbMessageRow;
      const assistRow = assistInsertRes.data as DbMessageRow;

      return {
        conversationId: convId,
        userMessage: {
          id: userRow.id,
          conversationId: convId,
          businessId,
          ownerUserId: userId,
          role: 'user',
          userText: userRow.user_text,
          assistantResponsePayload: null,
          sourceKeys: [],
          requiredCapabilities: [],
          createdAt: userRow.created_at,
        },
        assistantMessage: {
          id: assistRow.id,
          conversationId: convId,
          businessId,
          ownerUserId: userId,
          role: 'assistant',
          userText: null,
          assistantResponsePayload: assistRow.assistant_response_payload,
          sourceKeys: [],
          requiredCapabilities: Array.from(requiredCapsSet),
          createdAt: assistRow.created_at,
        },
      };
    }

    // 7. Structured AI Generation
    const availableFactKeys = new Set(factsMap.keys());
    const availableEntityKeys = new Set(entitiesMap.keys());
    const availableFactsList = Array.from(factsMap.values());
    const availableEntitiesList = Array.from(entitiesMap.values());

    const aiContextProjection = {
      userQuestion: trimmedMessage,
      conversationHistory: historyTurns,
      dataSummaries: executedTools.map((t) => t.dataSummary),
      availableFacts: availableFactsList.map((f) => ({ key: f.key, label: f.label, formattedValue: f.formattedValue })),
      availableEntities: availableEntitiesList.map((e) => ({ key: e.key, displayName: e.displayName, secondaryInfo: e.secondaryInfo })),
      allowableSourceKeys: Array.from(sourceKeysSet),
      allowableActionKeys: Array.from(actionKeysSet),
    };

    const appService = new AIApplicationService(geminiClient);
    let structuredResponse: StructuredAskNnooResponse;

    try {
      structuredResponse = await appService.executeFeature({
        featureKey: 'ai.ask_nnoo',
        context: {
          businessId,
          userId,
          userRole,
        },
        userInput: trimmedMessage,
        verifiedContext: aiContextProjection,
        responseSchema: StructuredAskNnooResponseSchema,
        jsonSchema: {
          type: 'object',
          properties: {
            schemaVersion: { type: 'string' },
            responseType: {
              type: 'string',
              enum: [
                'ANSWER',
                'LIST',
                'COMPARISON',
                'EXPLANATION',
                'INSUFFICIENT_DATA',
                'FORBIDDEN',
                'UNSUPPORTED_REQUEST',
                'MUTATION_REQUIRES_WORKFLOW',
                'NEEDS_CLARIFICATION'
              ]
            },
            headline: { type: 'string', nullable: true },
            segments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['TEXT', 'FACT', 'SAFE_ENTITY_LABEL'] },
                  text: { type: 'string', nullable: true },
                  factKey: { type: 'string', nullable: true },
                  formattedValue: { type: 'string', nullable: true },
                  label: { type: 'string', nullable: true },
                  entityKey: { type: 'string', nullable: true }
                },
                required: ['type']
              }
            },
            factKeys: { type: 'array', items: { type: 'string' } },
            entityKeys: { type: 'array', items: { type: 'string' } },
            sourceKeys: { 
              type: 'array', 
              items: { 
                type: 'string',
                enum: [
                  'SALES_REPORT',
                  'EXPENSE_REPORT',
                  'PROFITABILITY_REPORT',
                  'RECEIVABLES',
                  'PAYABLES',
                  'INVENTORY',
                  'INVOICES',
                  'BOOKKEEPER',
                  'BUSINESS_OVERVIEW'
                ]
              } 
            },
            actionKeys: { 
              type: 'array', 
              items: { 
                type: 'string',
                enum: [
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
                  'CREATE_SALE'
                ]
              } 
            },
            followUpQuestions: { type: 'array', items: { type: 'string' } },
            requiredCapabilities: { type: 'array', items: { type: 'string' } }
          },
          required: [
            'schemaVersion',
            'responseType',
            'segments',
            'factKeys',
            'entityKeys',
            'sourceKeys',
            'actionKeys',
            'followUpQuestions',
            'requiredCapabilities'
          ]
        },
        geminiClient,
      });
    } catch (err: unknown) {
      // Direct Fact Fallback: If provider errors, render verified fact cards deterministically
      if (availableFactsList.length > 0) {
        structuredResponse = {
          schemaVersion: '1.0.0',
          responseType: 'ANSWER',
          headline: `Here are the latest verified records for your business`,
          segments: [
            {
              type: 'TEXT',
              text: 'Here are the verified records from your business reports:',
            },
            ...availableFactsList.map((f) => ({
              type: 'FACT' as const,
              factKey: f.key,
              formattedValue: f.formattedValue,
              label: f.label,
            })),
          ],
          factKeys: Array.from(availableFactKeys),
          entityKeys: Array.from(availableEntityKeys),
          sourceKeys: Array.from(sourceKeysSet),
          actionKeys: Array.from(actionKeysSet),
          followUpQuestions: [],
          requiredCapabilities: Array.from(requiredCapsSet),
        };
      } else {
        const errorObj = err as { code?: string; message?: string; retryable?: boolean };
        throw new AISafeError(
          (errorObj.code as any) || 'AI_INTERNAL_ERROR',
          errorObj.message || 'Failed to generate response.',
          errorObj.retryable ?? true
        );
      }
    }

    // 8. Output Validation via NumericLiteralGuard
    AskNnooNumericGuard.validate(
      structuredResponse,
      availableFactKeys,
      availableEntityKeys,
      sourceKeysSet,
      actionKeysSet
    );

    // 9. Server Fact & Entity Substitution
    const renderedSegments = structuredResponse.segments.map((seg) => {
      if (seg.type === 'FACT' && seg.factKey) {
        const fact = factsMap.get(seg.factKey);
        return {
          ...seg,
          formattedValue: fact?.formattedValue || seg.formattedValue,
          label: fact?.label || seg.label,
        };
      }
      if (seg.type === 'SAFE_ENTITY_LABEL' && seg.entityKey) {
        const entity = entitiesMap.get(seg.entityKey);
        return {
          ...seg,
          label: entity?.displayName || seg.label,
        };
      }
      return seg;
    });

    const renderedPayload: AskNnooRenderedPayload = {
      schemaVersion: structuredResponse.schemaVersion,
      responseType: structuredResponse.responseType,
      headline: structuredResponse.headline,
      segments: renderedSegments,
      facts: availableFactsList,
      entities: availableEntitiesList,
      sourceKeys: structuredResponse.sourceKeys || Array.from(sourceKeysSet),
      actionKeys: structuredResponse.actionKeys || Array.from(actionKeysSet),
      followUpQuestions: structuredResponse.followUpQuestions || [],
    };

    // 10. Persist Messages
    const [userInsertRes, assistInsertRes] = await Promise.all([
      supabase
        .from('ai_messages')
        .insert({
          conversation_id: convId,
          business_id: businessId,
          owner_user_id: userId,
          role: 'user',
          user_text: trimmedMessage,
          source_keys: [],
          required_capabilities: [],
        })
        .select('*')
        .single(),
      supabase
        .from('ai_messages')
        .insert({
          conversation_id: convId,
          business_id: businessId,
          owner_user_id: userId,
          role: 'assistant',
          assistant_response_payload: renderedPayload,
          source_keys: Array.from(sourceKeysSet),
          required_capabilities: Array.from(requiredCapsSet),
          model_id: 'gemini-3.6-flash',
          prompt_version: '1.0.0',
          response_schema_version: '1.0.0',
        })
        .select('*')
        .single(),
    ]);

    await supabase
      .from('ai_conversations')
      .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', convId);

    const userRow = userInsertRes.data as DbMessageRow;
    const assistRow = assistInsertRes.data as DbMessageRow;

    return {
      conversationId: convId,
      userMessage: {
        id: userRow.id,
        conversationId: convId,
        businessId,
        ownerUserId: userId,
        role: 'user',
        userText: userRow.user_text,
        assistantResponsePayload: null,
        sourceKeys: [],
        requiredCapabilities: [],
        createdAt: userRow.created_at,
      },
      assistantMessage: {
        id: assistRow.id,
        conversationId: convId,
        businessId,
        ownerUserId: userId,
        role: 'assistant',
        userText: null,
        assistantResponsePayload: assistRow.assistant_response_payload,
        sourceKeys: assistRow.source_keys || [],
        requiredCapabilities: assistRow.required_capabilities || [],
        createdAt: assistRow.created_at,
      },
    };
  }
}
