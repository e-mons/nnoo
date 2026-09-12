-- ==============================================================================
-- Migration: Ask NNOO — Production Business AI Assistant Conversations & Messages
-- Description: Stores user conversations, message turns, rendered response payloads,
--              source provenance, and required capability tags for role downgrade security.
-- ==============================================================================

-- 1. Create table for Ask NNOO conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create table for Ask NNOO messages
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  user_text text,
  assistant_response_payload jsonb,
  source_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  required_capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  period_context jsonb,
  prompt_version text,
  response_schema_version text,
  model_id text,
  ai_invocation_id uuid REFERENCES public.ai_invocations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Lookup and performance indexes
CREATE INDEX IF NOT EXISTS idx_ai_convs_user_business
  ON public.ai_conversations (owner_user_id, business_id, status, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_convs_business_only
  ON public.ai_conversations (business_id, status);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv
  ON public.ai_messages (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ai_messages_user_business
  ON public.ai_messages (business_id, owner_user_id);

-- 4. Enable Row-Level Security (RLS)
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Platform admins manage all conversations and messages
CREATE POLICY "Platform admins manage all conversations"
  ON public.ai_conversations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Platform admins manage all messages"
  ON public.ai_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid()
    )
  );

-- Business members view their own conversations in their active business
CREATE POLICY "Users view their own conversations in permitted business"
  ON public.ai_conversations
  FOR SELECT
  TO authenticated
  USING (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = ai_conversations.business_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users view their own messages in permitted business"
  ON public.ai_messages
  FOR SELECT
  TO authenticated
  USING (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = ai_messages.business_id
        AND bm.user_id = auth.uid()
    )
  );

-- Direct client mutations are denied; all creations flow through trusted server services
CREATE POLICY "Deny client direct inserts on ai_conversations"
  ON public.ai_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client direct updates on ai_conversations"
  ON public.ai_conversations
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Deny client direct deletes on ai_conversations"
  ON public.ai_conversations
  FOR DELETE
  TO authenticated
  USING (false);

CREATE POLICY "Deny client direct inserts on ai_messages"
  ON public.ai_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client direct updates on ai_messages"
  ON public.ai_messages
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Deny client direct deletes on ai_messages"
  ON public.ai_messages
  FOR DELETE
  TO authenticated
  USING (false);
