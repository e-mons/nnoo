import 'server-only';
import type { AIToolDefinition, AIErrorCode, AISafeError } from '@nnoo/contracts';

export interface ToolExecutionContext {
  businessId: string;
  userId: string;
  userRole: string;
  userPermissions: string[];
}

/**
 * Controlled AI Tool Registry.
 * Default policy: READ-ONLY.
 * In Prompt 1, ZERO financial mutation tools and ZERO SQL execution tools exist.
 */
export const ALLOWED_AI_TOOLS: Record<string, AIToolDefinition> = {
  // Read-only tools will be registered in subsequent prompts (e.g. Prompt 5 Ask NNOO).
  // Foundation Prompt 1 establishes the security boundary with zero callable tools.
};

/**
 * Validates and executes an AI tool call with independent server authorization.
 */
export async function executeAITool(
  toolName: string,
  args: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<Record<string, unknown>> {
  const tool = ALLOWED_AI_TOOLS[toolName];

  if (!tool) {
    throw {
      code: 'AI_TOOL_NOT_ALLOWED' as AIErrorCode,
      message: `Tool "${toolName}" is not registered or permitted for execution.`,
      retryable: false,
    } satisfies AISafeError;
  }

  if (tool.requiredPermission && !context.userPermissions.includes(tool.requiredPermission)) {
    throw {
      code: 'AI_TOOL_FORBIDDEN' as AIErrorCode,
      message: `User lacks required permission "${tool.requiredPermission}" for tool "${toolName}".`,
      retryable: false,
    } satisfies AISafeError;
  }

  if (!tool.readOnly) {
    throw {
      code: 'AI_TOOL_FORBIDDEN' as AIErrorCode,
      message: `Mutation tools are strictly disabled for AI execution.`,
      retryable: false,
    } satisfies AISafeError;
  }

  // If a future tool handler exists, execute it safely with server-derived context
  throw {
    code: 'AI_TOOL_NOT_ALLOWED' as AIErrorCode,
    message: `Tool execution handler for "${toolName}" is not implemented.`,
    retryable: false,
  } satisfies AISafeError;
}
