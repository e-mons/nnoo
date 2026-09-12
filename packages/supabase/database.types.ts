export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_bookkeeping_applications: {
        Row: {
          application_kind: string
          applied_at: string
          applied_by_user_id: string
          business_id: string
          canonical_target_id: string
          canonical_target_type: string
          classification_id: string
          created_at: string
          error_code: string | null
          expense_id: string | null
          expense_payment_id: string | null
          id: string
          idempotency_key: string
          payload_fingerprint: string
          review_id: string | null
          sale_id: string | null
          sale_payment_id: string | null
          sale_refund_id: string | null
          status: string
          stock_receipt_id: string | null
          stock_receipt_payment_id: string | null
        }
        Insert: {
          application_kind: string
          applied_at?: string
          applied_by_user_id: string
          business_id: string
          canonical_target_id: string
          canonical_target_type: string
          classification_id: string
          created_at?: string
          error_code?: string | null
          expense_id?: string | null
          expense_payment_id?: string | null
          id?: string
          idempotency_key: string
          payload_fingerprint: string
          review_id?: string | null
          sale_id?: string | null
          sale_payment_id?: string | null
          sale_refund_id?: string | null
          status?: string
          stock_receipt_id?: string | null
          stock_receipt_payment_id?: string | null
        }
        Update: {
          application_kind?: string
          applied_at?: string
          applied_by_user_id?: string
          business_id?: string
          canonical_target_id?: string
          canonical_target_type?: string
          classification_id?: string
          created_at?: string
          error_code?: string | null
          expense_id?: string | null
          expense_payment_id?: string | null
          id?: string
          idempotency_key?: string
          payload_fingerprint?: string
          review_id?: string | null
          sale_id?: string | null
          sale_payment_id?: string | null
          sale_refund_id?: string | null
          status?: string
          stock_receipt_id?: string | null
          stock_receipt_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_bookkeeping_applications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bookkeeping_applications_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "ai_bookkeeping_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bookkeeping_applications_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bookkeeping_applications_expense_payment_id_fkey"
            columns: ["expense_payment_id"]
            isOneToOne: false
            referencedRelation: "expense_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bookkeeping_applications_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "ai_bookkeeping_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bookkeeping_applications_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bookkeeping_applications_sale_payment_id_fkey"
            columns: ["sale_payment_id"]
            isOneToOne: false
            referencedRelation: "sale_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bookkeeping_applications_sale_refund_id_fkey"
            columns: ["sale_refund_id"]
            isOneToOne: false
            referencedRelation: "sale_refunds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bookkeeping_applications_stock_receipt_id_fkey"
            columns: ["stock_receipt_id"]
            isOneToOne: false
            referencedRelation: "stock_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bookkeeping_applications_stock_receipt_payment_id_fkey"
            columns: ["stock_receipt_payment_id"]
            isOneToOne: false
            referencedRelation: "stock_receipt_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bookkeeping_classifications: {
        Row: {
          ai_invocation_id: string | null
          amount_minor: number | null
          business_id: string
          classification_status: string
          confidence_band: string
          counterparty_text: string | null
          created_at: string
          currency_code: string
          customer_candidate_id: string | null
          description: string
          expense_category_candidate_id: string | null
          id: string
          idempotency_key: string | null
          input_fingerprint: string
          missing_fields: Json
          model_id: string
          operation_kind: string
          payment_method: string | null
          possible_duplicate_ids: Json
          prompt_version: string
          reference_text: string | null
          requested_by_user_id: string
          response_schema_version: string
          short_explanation: string
          source_kind: string
          source_record_id: string | null
          source_record_type: string | null
          superseded_at: string | null
          supplier_candidate_id: string | null
          transaction_date: string | null
          transaction_direction: string | null
          warning_codes: Json
        }
        Insert: {
          ai_invocation_id?: string | null
          amount_minor?: number | null
          business_id: string
          classification_status?: string
          confidence_band: string
          counterparty_text?: string | null
          created_at?: string
          currency_code?: string
          customer_candidate_id?: string | null
          description: string
          expense_category_candidate_id?: string | null
          id?: string
          idempotency_key?: string | null
          input_fingerprint: string
          missing_fields?: Json
          model_id: string
          operation_kind: string
          payment_method?: string | null
          possible_duplicate_ids?: Json
          prompt_version: string
          reference_text?: string | null
          requested_by_user_id: string
          response_schema_version: string
          short_explanation: string
          source_kind?: string
          source_record_id?: string | null
          source_record_type?: string | null
          superseded_at?: string | null
          supplier_candidate_id?: string | null
          transaction_date?: string | null
          transaction_direction?: string | null
          warning_codes?: Json
        }
        Update: {
          ai_invocation_id?: string | null
          amount_minor?: number | null
          business_id?: string
          classification_status?: string
          confidence_band?: string
          counterparty_text?: string | null
          created_at?: string
          currency_code?: string
          customer_candidate_id?: string | null
          description?: string
          expense_category_candidate_id?: string | null
          id?: string
          idempotency_key?: string | null
          input_fingerprint?: string
          missing_fields?: Json
          model_id?: string
          operation_kind?: string
          payment_method?: string | null
          possible_duplicate_ids?: Json
          prompt_version?: string
          reference_text?: string | null
          requested_by_user_id?: string
          response_schema_version?: string
          short_explanation?: string
          source_kind?: string
          source_record_id?: string | null
          source_record_type?: string | null
          superseded_at?: string | null
          supplier_candidate_id?: string | null
          transaction_date?: string | null
          transaction_direction?: string | null
          warning_codes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_bookkeeping_classification_expense_category_candidate_i_fkey"
            columns: ["expense_category_candidate_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bookkeeping_classifications_ai_invocation_id_fkey"
            columns: ["ai_invocation_id"]
            isOneToOne: false
            referencedRelation: "ai_invocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bookkeeping_classifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bookkeeping_classifications_customer_candidate_id_fkey"
            columns: ["customer_candidate_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bookkeeping_classifications_supplier_candidate_id_fkey"
            columns: ["supplier_candidate_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bookkeeping_reviews: {
        Row: {
          ai_operation_kind: string
          business_id: string
          category_correction_state: string
          classification_id: string
          counterparty_correction_state: string
          created_at: string
          duplicate_warning_state: string
          final_operation_kind: string
          id: string
          review_action: string
          review_notes: string | null
          reviewer_user_id: string
        }
        Insert: {
          ai_operation_kind: string
          business_id: string
          category_correction_state?: string
          classification_id: string
          counterparty_correction_state?: string
          created_at?: string
          duplicate_warning_state?: string
          final_operation_kind: string
          id?: string
          review_action: string
          review_notes?: string | null
          reviewer_user_id: string
        }
        Update: {
          ai_operation_kind?: string
          business_id?: string
          category_correction_state?: string
          classification_id?: string
          counterparty_correction_state?: string
          created_at?: string
          duplicate_warning_state?: string
          final_operation_kind?: string
          id?: string
          review_action?: string
          review_notes?: string | null
          reviewer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_bookkeeping_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bookkeeping_reviews_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "ai_bookkeeping_classifications"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_business_health_snapshots: {
        Row: {
          action_keys: Json
          ai_explanation: Json | null
          applicable_dimension_keys: Json
          as_of_timestamp: string
          attention_reason_keys: Json
          business_id: string
          business_timezone: string
          created_at: string
          created_by_user_id: string
          currency_code: string
          data_coverage: string
          dimension_results: Json
          evaluation_period_end: string
          evaluation_period_start: string
          formula_version: string
          id: string
          score: number | null
          score_band: string | null
          source_fingerprint: string
          status: string
          strength_reason_keys: Json
        }
        Insert: {
          action_keys?: Json
          ai_explanation?: Json | null
          applicable_dimension_keys?: Json
          as_of_timestamp?: string
          attention_reason_keys?: Json
          business_id: string
          business_timezone?: string
          created_at?: string
          created_by_user_id: string
          currency_code?: string
          data_coverage: string
          dimension_results?: Json
          evaluation_period_end: string
          evaluation_period_start: string
          formula_version?: string
          id?: string
          score?: number | null
          score_band?: string | null
          source_fingerprint: string
          status: string
          strength_reason_keys?: Json
        }
        Update: {
          action_keys?: Json
          ai_explanation?: Json | null
          applicable_dimension_keys?: Json
          as_of_timestamp?: string
          attention_reason_keys?: Json
          business_id?: string
          business_timezone?: string
          created_at?: string
          created_by_user_id?: string
          currency_code?: string
          data_coverage?: string
          dimension_results?: Json
          evaluation_period_end?: string
          evaluation_period_start?: string
          formula_version?: string
          id?: string
          score?: number | null
          score_band?: string | null
          source_fingerprint?: string
          status?: string
          strength_reason_keys?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_business_health_snapshots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_business_summaries: {
        Row: {
          ai_invocation_id: string | null
          as_of_timestamp: string
          business_id: string
          business_timezone: string
          created_at: string
          currency_code: string
          headline: string
          id: string
          model_id: string
          overview: string
          period_end: string
          period_start: string
          permission_scope_fingerprint: string
          prompt_version: string
          requested_by_user_id: string
          response_schema_version: string
          selected_action_keys: Json
          selected_attention_signal_keys: Json
          selected_highlight_signal_keys: Json
          source_fact_schema_version: string
          source_fingerprint: string
          status: string
          summary_type: string
          verified_fact_snapshot: Json
        }
        Insert: {
          ai_invocation_id?: string | null
          as_of_timestamp?: string
          business_id: string
          business_timezone?: string
          created_at?: string
          currency_code?: string
          headline: string
          id?: string
          model_id?: string
          overview: string
          period_end: string
          period_start: string
          permission_scope_fingerprint: string
          prompt_version?: string
          requested_by_user_id: string
          response_schema_version?: string
          selected_action_keys?: Json
          selected_attention_signal_keys?: Json
          selected_highlight_signal_keys?: Json
          source_fact_schema_version?: string
          source_fingerprint: string
          status?: string
          summary_type: string
          verified_fact_snapshot?: Json
        }
        Update: {
          ai_invocation_id?: string | null
          as_of_timestamp?: string
          business_id?: string
          business_timezone?: string
          created_at?: string
          currency_code?: string
          headline?: string
          id?: string
          model_id?: string
          overview?: string
          period_end?: string
          period_start?: string
          permission_scope_fingerprint?: string
          prompt_version?: string
          requested_by_user_id?: string
          response_schema_version?: string
          selected_action_keys?: Json
          selected_attention_signal_keys?: Json
          selected_highlight_signal_keys?: Json
          source_fact_schema_version?: string
          source_fingerprint?: string
          status?: string
          summary_type?: string
          verified_fact_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_business_summaries_ai_invocation_id_fkey"
            columns: ["ai_invocation_id"]
            isOneToOne: false
            referencedRelation: "ai_invocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_business_summaries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          business_id: string
          created_at: string
          id: string
          last_message_at: string
          owner_user_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          owner_user_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          owner_user_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_invocations: {
        Row: {
          business_id: string | null
          completed_at: string | null
          created_at: string
          error_code: string | null
          feature_key: string
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model_id: string
          output_tokens: number | null
          prompt_version: string
          provider_request_id: string | null
          request_fingerprint: string | null
          response_schema_version: string
          status: string
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          feature_key: string
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model_id: string
          output_tokens?: number | null
          prompt_version: string
          provider_request_id?: string | null
          request_fingerprint?: string | null
          response_schema_version: string
          status: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          feature_key?: string
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model_id?: string
          output_tokens?: number | null
          prompt_version?: string
          provider_request_id?: string | null
          request_fingerprint?: string | null
          response_schema_version?: string
          status?: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_invocations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          ai_invocation_id: string | null
          assistant_response_payload: Json | null
          business_id: string
          conversation_id: string
          created_at: string
          id: string
          model_id: string | null
          owner_user_id: string
          period_context: Json | null
          prompt_version: string | null
          required_capabilities: Json
          response_schema_version: string | null
          role: string
          source_keys: Json
          user_text: string | null
        }
        Insert: {
          ai_invocation_id?: string | null
          assistant_response_payload?: Json | null
          business_id: string
          conversation_id: string
          created_at?: string
          id?: string
          model_id?: string | null
          owner_user_id: string
          period_context?: Json | null
          prompt_version?: string | null
          required_capabilities?: Json
          response_schema_version?: string | null
          role: string
          source_keys?: Json
          user_text?: string | null
        }
        Update: {
          ai_invocation_id?: string | null
          assistant_response_payload?: Json | null
          business_id?: string
          conversation_id?: string
          created_at?: string
          id?: string
          model_id?: string | null
          owner_user_id?: string
          period_context?: Json | null
          prompt_version?: string | null
          required_capabilities?: Json
          response_schema_version?: string | null
          role?: string
          source_keys?: Json
          user_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_ai_invocation_id_fkey"
            columns: ["ai_invocation_id"]
            isOneToOne: false
            referencedRelation: "ai_invocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plan_provider_mappings: {
        Row: {
          billing_plan_id: string
          created_at: string
          id: string
          is_active: boolean
          last_verified_at: string | null
          provider: string
          provider_environment: string
          provider_plan_code: string
          provider_plan_id: string | null
          synced_amount_minor: number | null
          synced_currency_code: string | null
          synced_interval: string | null
          updated_at: string
        }
        Insert: {
          billing_plan_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_verified_at?: string | null
          provider?: string
          provider_environment: string
          provider_plan_code: string
          provider_plan_id?: string | null
          synced_amount_minor?: number | null
          synced_currency_code?: string | null
          synced_interval?: string | null
          updated_at?: string
        }
        Update: {
          billing_plan_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_verified_at?: string | null
          provider?: string
          provider_environment?: string
          provider_plan_code?: string
          provider_plan_id?: string | null
          synced_amount_minor?: number | null
          synced_currency_code?: string | null
          synced_interval?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_plan_provider_mappings_billing_plan_id_fkey"
            columns: ["billing_plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plans: {
        Row: {
          amount_minor: number
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          code: string
          created_at: string
          currency_code: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          amount_minor: number
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          code: string
          created_at?: string
          currency_code?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          code?: string
          created_at?: string
          currency_code?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      billing_transactions: {
        Row: {
          amount_minor: number
          billing_plan_id: string
          business_id: string
          business_subscription_id: string | null
          channel: string | null
          created_at: string
          currency_code: string
          failed_at: string | null
          id: string
          normalized_status: Database["public"]["Enums"]["billing_transaction_status"]
          paid_at: string | null
          provider: string
          provider_customer_code: string | null
          provider_environment: string
          provider_reference: string
          provider_status: string | null
          provider_subscription_code: string | null
          provider_transaction_id: string | null
          raw_event_reference: string | null
          transaction_type: Database["public"]["Enums"]["billing_transaction_type"]
          updated_at: string
        }
        Insert: {
          amount_minor: number
          billing_plan_id: string
          business_id: string
          business_subscription_id?: string | null
          channel?: string | null
          created_at?: string
          currency_code?: string
          failed_at?: string | null
          id?: string
          normalized_status?: Database["public"]["Enums"]["billing_transaction_status"]
          paid_at?: string | null
          provider?: string
          provider_customer_code?: string | null
          provider_environment: string
          provider_reference: string
          provider_status?: string | null
          provider_subscription_code?: string | null
          provider_transaction_id?: string | null
          raw_event_reference?: string | null
          transaction_type: Database["public"]["Enums"]["billing_transaction_type"]
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          billing_plan_id?: string
          business_id?: string
          business_subscription_id?: string | null
          channel?: string | null
          created_at?: string
          currency_code?: string
          failed_at?: string | null
          id?: string
          normalized_status?: Database["public"]["Enums"]["billing_transaction_status"]
          paid_at?: string | null
          provider?: string
          provider_customer_code?: string | null
          provider_environment?: string
          provider_reference?: string
          provider_status?: string | null
          provider_subscription_code?: string | null
          provider_transaction_id?: string | null
          raw_event_reference?: string | null
          transaction_type?: Database["public"]["Enums"]["billing_transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_transactions_billing_plan_id_fkey"
            columns: ["billing_plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_transactions_business_subscription_id_fkey"
            columns: ["business_subscription_id"]
            isOneToOne: false
            referencedRelation: "business_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_webhook_events: {
        Row: {
          created_at: string
          event_dedupe_key: string
          event_type: string
          failure_code: string | null
          id: string
          payload_hash: string
          processed_at: string | null
          processing_status: Database["public"]["Enums"]["billing_webhook_status"]
          provider: string
          provider_environment: string
          provider_reference: string | null
          provider_subscription_code: string | null
          received_at: string
        }
        Insert: {
          created_at?: string
          event_dedupe_key: string
          event_type: string
          failure_code?: string | null
          id?: string
          payload_hash: string
          processed_at?: string | null
          processing_status?: Database["public"]["Enums"]["billing_webhook_status"]
          provider?: string
          provider_environment: string
          provider_reference?: string | null
          provider_subscription_code?: string | null
          received_at?: string
        }
        Update: {
          created_at?: string
          event_dedupe_key?: string
          event_type?: string
          failure_code?: string | null
          id?: string
          payload_hash?: string
          processed_at?: string | null
          processing_status?: Database["public"]["Enums"]["billing_webhook_status"]
          provider?: string
          provider_environment?: string
          provider_reference?: string | null
          provider_subscription_code?: string | null
          received_at?: string
        }
        Relationships: []
      }
      business_attention_events: {
        Row: {
          business_id: string
          category: string
          created_at: string
          dedupe_key: string
          first_detected_at: string
          id: string
          last_detected_at: string
          metadata: Json
          resolved_at: string | null
          severity: string
          source_reference: string | null
          source_type: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          category: string
          created_at?: string
          dedupe_key: string
          first_detected_at?: string
          id?: string
          last_detected_at?: string
          metadata?: Json
          resolved_at?: string | null
          severity?: string
          source_reference?: string | null
          source_type: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          category?: string
          created_at?: string
          dedupe_key?: string
          first_detected_at?: string
          id?: string
          last_detected_at?: string
          metadata?: Json
          resolved_at?: string | null
          severity?: string
          source_reference?: string | null
          source_type?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_attention_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_automations: {
        Row: {
          automation_type: string
          business_id: string
          config_version: number
          created_at: string
          created_by_user_id: string | null
          enabled: boolean
          frequency: string
          id: string
          schedule_local_time: string
          schedule_monthday: number | null
          schedule_weekday: number | null
          updated_at: string
          updated_by_user_id: string | null
        }
        Insert: {
          automation_type: string
          business_id: string
          config_version?: number
          created_at?: string
          created_by_user_id?: string | null
          enabled?: boolean
          frequency?: string
          id?: string
          schedule_local_time?: string
          schedule_monthday?: number | null
          schedule_weekday?: number | null
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Update: {
          automation_type?: string
          business_id?: string
          config_version?: number
          created_at?: string
          created_by_user_id?: string | null
          enabled?: boolean
          frequency?: string
          id?: string
          schedule_local_time?: string
          schedule_monthday?: number | null
          schedule_weekday?: number | null
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_automations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_billing_access_overrides: {
        Row: {
          business_id: string
          created_at: string
          created_by_platform_admin_id: string
          ends_at: string | null
          id: string
          internal_note: string | null
          override_type: Database["public"]["Enums"]["billing_override_type"]
          reason: string
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by_platform_admin_id: string | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by_platform_admin_id: string
          ends_at?: string | null
          id?: string
          internal_note?: string | null
          override_type: Database["public"]["Enums"]["billing_override_type"]
          reason: string
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by_platform_admin_id?: string | null
          starts_at?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by_platform_admin_id?: string
          ends_at?: string | null
          id?: string
          internal_note?: string | null
          override_type?: Database["public"]["Enums"]["billing_override_type"]
          reason?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by_platform_admin_id?: string | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_billing_access_overr_created_by_platform_admin_id_fkey"
            columns: ["created_by_platform_admin_id"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_billing_access_overr_revoked_by_platform_admin_id_fkey"
            columns: ["revoked_by_platform_admin_id"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_billing_access_overrides_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_billing_customers: {
        Row: {
          billing_email: string
          business_id: string
          created_at: string
          id: string
          provider: string
          provider_customer_code: string
          provider_customer_id: string | null
          provider_environment: string
          updated_at: string
        }
        Insert: {
          billing_email: string
          business_id: string
          created_at?: string
          id?: string
          provider?: string
          provider_customer_code: string
          provider_customer_id?: string | null
          provider_environment: string
          updated_at?: string
        }
        Update: {
          billing_email?: string
          business_id?: string
          created_at?: string
          id?: string
          provider?: string
          provider_customer_code?: string
          provider_customer_id?: string | null
          provider_environment?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_billing_customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_invitations: {
        Row: {
          business_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          last_sent_at: string | null
          role: string
          status: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          last_sent_at?: string | null
          role: string
          status?: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          last_sent_at?: string | null
          role?: string
          status?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_memberships: {
        Row: {
          business_id: string
          created_at: string
          id: string
          membership_status: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          membership_status?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          membership_status?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_notifications: {
        Row: {
          body: string
          business_id: string
          channel: string
          created_at: string
          dedupe_key: string
          id: string
          notification_category: string
          notification_type: string
          payload: Json
          primary_action_key: string
          read_at: string | null
          recipient_user_id: string
          required_capabilities: string[]
          resolved_at: string | null
          source_event_id: string | null
          source_reference_id: string | null
          source_reference_type: string | null
          title: string
        }
        Insert: {
          body: string
          business_id: string
          channel?: string
          created_at?: string
          dedupe_key: string
          id?: string
          notification_category: string
          notification_type: string
          payload?: Json
          primary_action_key: string
          read_at?: string | null
          recipient_user_id: string
          required_capabilities?: string[]
          resolved_at?: string | null
          source_event_id?: string | null
          source_reference_id?: string | null
          source_reference_type?: string | null
          title: string
        }
        Update: {
          body?: string
          business_id?: string
          channel?: string
          created_at?: string
          dedupe_key?: string
          id?: string
          notification_category?: string
          notification_type?: string
          payload?: Json
          primary_action_key?: string
          read_at?: string | null
          recipient_user_id?: string
          required_capabilities?: string[]
          resolved_at?: string | null
          source_event_id?: string | null
          source_reference_id?: string | null
          source_reference_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_sequences: {
        Row: {
          business_id: string
          created_at: string
          id: string
          last_value: number
          prefix: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          last_value?: number
          prefix: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          last_value?: number
          prefix?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_sequences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_subscriptions: {
        Row: {
          activated_at: string | null
          billing_plan_id: string
          business_id: string
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          latest_failed_payment_at: string | null
          latest_successful_payment_at: string | null
          next_payment_at: string | null
          normalized_status: Database["public"]["Enums"]["billing_subscription_status"]
          provider: string
          provider_customer_code: string | null
          provider_environment: string
          provider_status: string | null
          provider_subscription_code: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          billing_plan_id: string
          business_id: string
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          latest_failed_payment_at?: string | null
          latest_successful_payment_at?: string | null
          next_payment_at?: string | null
          normalized_status?: Database["public"]["Enums"]["billing_subscription_status"]
          provider?: string
          provider_customer_code?: string | null
          provider_environment: string
          provider_status?: string | null
          provider_subscription_code?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          billing_plan_id?: string
          business_id?: string
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          latest_failed_payment_at?: string | null
          latest_successful_payment_at?: string | null
          next_payment_at?: string | null
          normalized_status?: Database["public"]["Enums"]["billing_subscription_status"]
          provider?: string
          provider_customer_code?: string | null
          provider_environment?: string
          provider_status?: string | null
          provider_subscription_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_subscriptions_billing_plan_id_fkey"
            columns: ["billing_plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          country_code: string
          created_at: string
          currency_code: string
          email: string | null
          id: string
          industry: string
          legal_name: string | null
          local_government_area: string | null
          logo_path: string | null
          name: string
          phone: string | null
          registration_number: string | null
          state: string | null
          status: string
          tax_identifier: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          currency_code?: string
          email?: string | null
          id?: string
          industry: string
          legal_name?: string | null
          local_government_area?: string | null
          logo_path?: string | null
          name: string
          phone?: string | null
          registration_number?: string | null
          state?: string | null
          status?: string
          tax_identifier?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          currency_code?: string
          email?: string | null
          id?: string
          industry?: string
          legal_name?: string | null
          local_government_area?: string | null
          logo_path?: string | null
          name?: string
          phone?: string | null
          registration_number?: string | null
          state?: string | null
          status?: string
          tax_identifier?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          barcode: string | null
          business_id: string
          category_id: string | null
          cost_price_minor: number | null
          created_at: string
          created_by_user_id: string | null
          currency_code: string
          description: string | null
          id: string
          image_path: string | null
          item_type: string
          low_stock_threshold: number
          name: string
          selling_price_minor: number
          sku: string | null
          status: string
          track_inventory: boolean
          unit_code: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          business_id: string
          category_id?: string | null
          cost_price_minor?: number | null
          created_at?: string
          created_by_user_id?: string | null
          currency_code: string
          description?: string | null
          id?: string
          image_path?: string | null
          item_type: string
          low_stock_threshold?: number
          name: string
          selling_price_minor: number
          sku?: string | null
          status?: string
          track_inventory?: boolean
          unit_code: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          business_id?: string
          category_id?: string | null
          cost_price_minor?: number | null
          created_at?: string
          created_by_user_id?: string | null
          currency_code?: string
          description?: string | null
          id?: string
          image_path?: string | null
          item_type?: string
          low_stock_threshold?: number
          name?: string
          selling_price_minor?: number
          sku?: string | null
          status?: string
          track_inventory?: boolean
          unit_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_enquiries: {
        Row: {
          business_name: string | null
          category: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          category: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          category?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_passport_shares: {
        Row: {
          access_count: number
          business_id: string
          created_at: string
          created_by_user_id: string
          expires_at: string
          id: string
          last_accessed_at: string | null
          passport_snapshot_id: string
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          access_count?: number
          business_id: string
          created_at?: string
          created_by_user_id: string
          expires_at: string
          id?: string
          last_accessed_at?: string | null
          passport_snapshot_id: string
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          access_count?: number
          business_id?: string
          created_at?: string
          created_by_user_id?: string
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          passport_snapshot_id?: string
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_passport_shares_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_passport_shares_passport_snapshot_id_fkey"
            columns: ["passport_snapshot_id"]
            isOneToOne: false
            referencedRelation: "credit_passport_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_passport_snapshots: {
        Row: {
          ai_explanation: Json | null
          artifact_hash: string
          as_of_timestamp: string
          business_id: string
          created_at: string
          data_coverage: string
          generated_by_user_id: string
          health_score_snapshot_id: string | null
          id: string
          passport_code: string
          passport_schema_version: string
          passport_version: number
          period_end: string
          period_start: string
          snapshot_payload: Json
          source_fingerprint: string
          status: string
        }
        Insert: {
          ai_explanation?: Json | null
          artifact_hash: string
          as_of_timestamp?: string
          business_id: string
          created_at?: string
          data_coverage: string
          generated_by_user_id: string
          health_score_snapshot_id?: string | null
          id?: string
          passport_code: string
          passport_schema_version?: string
          passport_version?: number
          period_end: string
          period_start: string
          snapshot_payload: Json
          source_fingerprint: string
          status?: string
        }
        Update: {
          ai_explanation?: Json | null
          artifact_hash?: string
          as_of_timestamp?: string
          business_id?: string
          created_at?: string
          data_coverage?: string
          generated_by_user_id?: string
          health_score_snapshot_id?: string | null
          id?: string
          passport_code?: string
          passport_schema_version?: string
          passport_version?: number
          period_end?: string
          period_start?: string
          snapshot_payload?: Json
          source_fingerprint?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_passport_snapshots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_passport_snapshots_health_score_snapshot_id_fkey"
            columns: ["health_score_snapshot_id"]
            isOneToOne: false
            referencedRelation: "ai_business_health_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          archived_at: string | null
          business_id: string
          city: string | null
          company_name: string | null
          country_code: string | null
          created_at: string
          created_by_user_id: string | null
          customer_type: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          archived_at?: string | null
          business_id: string
          city?: string | null
          company_name?: string | null
          country_code?: string | null
          created_at?: string
          created_by_user_id?: string | null
          customer_type: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          archived_at?: string | null
          business_id?: string
          city?: string | null
          company_name?: string | null
          country_code?: string | null
          created_at?: string
          created_by_user_id?: string | null
          customer_type?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
          status: string
          system_key: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
          status?: string
          system_key?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          system_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_payments: {
        Row: {
          amount_minor: number
          business_id: string
          created_at: string
          currency_code: string
          effective_date: string
          expense_id: string
          external_reference: string | null
          id: string
          idempotency_key: string
          occurred_at: string
          paid_by_user_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Insert: {
          amount_minor: number
          business_id: string
          created_at?: string
          currency_code: string
          effective_date: string
          expense_id: string
          external_reference?: string | null
          id?: string
          idempotency_key: string
          occurred_at?: string
          paid_by_user_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Update: {
          amount_minor?: number
          business_id?: string
          created_at?: string
          currency_code?: string
          effective_date?: string
          expense_id?: string
          external_reference?: string | null
          id?: string
          idempotency_key?: string
          occurred_at?: string
          paid_by_user_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
        }
        Relationships: [
          {
            foreignKeyName: "expense_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_payments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          business_id: string
          category_id: string
          created_at: string
          created_by_user_id: string | null
          currency_code: string
          description: string
          due_date: string | null
          effective_date: string
          expense_number: string
          external_reference: string | null
          id: string
          idempotency_key: string
          notes: string | null
          occurred_at: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          receipt_path: string | null
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by_user_id: string | null
          status: Database["public"]["Enums"]["expense_status"]
          supplier_id: string | null
          total_minor: number
          updated_at: string
        }
        Insert: {
          business_id: string
          category_id: string
          created_at?: string
          created_by_user_id?: string | null
          currency_code: string
          description: string
          due_date?: string | null
          effective_date: string
          expense_number: string
          external_reference?: string | null
          id?: string
          idempotency_key: string
          notes?: string | null
          occurred_at?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          receipt_path?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by_user_id?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          supplier_id?: string | null
          total_minor: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          category_id?: string
          created_at?: string
          created_by_user_id?: string | null
          currency_code?: string
          description?: string
          due_date?: string | null
          effective_date?: string
          expense_number?: string
          external_reference?: string | null
          id?: string
          idempotency_key?: string
          notes?: string | null
          occurred_at?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          receipt_path?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by_user_id?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          supplier_id?: string | null
          total_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_job_runs: {
        Row: {
          attempt_count: number
          automation_id: string | null
          business_id: string
          completed_at: string | null
          correlation_id: string | null
          created_at: string
          error_code: string | null
          id: string
          idempotency_key: string
          job_type: string
          provider_invocation_id: string | null
          result_id: string | null
          result_type: string | null
          scheduled_for: string | null
          skip_reason: string | null
          source_fingerprint: string | null
          started_at: string
          status: string
        }
        Insert: {
          attempt_count?: number
          automation_id?: string | null
          business_id: string
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          idempotency_key: string
          job_type: string
          provider_invocation_id?: string | null
          result_id?: string | null
          result_type?: string | null
          scheduled_for?: string | null
          skip_reason?: string | null
          source_fingerprint?: string | null
          started_at?: string
          status: string
        }
        Update: {
          attempt_count?: number
          automation_id?: string | null
          business_id?: string
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          idempotency_key?: string
          job_type?: string
          provider_invocation_id?: string | null
          result_id?: string | null
          result_type?: string | null
          scheduled_for?: string | null
          skip_reason?: string | null
          source_fingerprint?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_job_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "business_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_job_runs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_job_runs_provider_invocation_id_fkey"
            columns: ["provider_invocation_id"]
            isOneToOne: false
            referencedRelation: "ai_invocations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          business_id: string
          catalog_item_id: string
          created_at: string
          created_by_user_id: string | null
          id: string
          idempotency_key: string
          inventory_value_delta_minor: number
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          occurred_at: string
          quantity_delta: number
          source_event_id: string
          source_event_type: string
          source_line_id: string | null
          unit_code_snapshot: string | null
        }
        Insert: {
          business_id: string
          catalog_item_id: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          idempotency_key: string
          inventory_value_delta_minor: number
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          occurred_at: string
          quantity_delta: number
          source_event_id: string
          source_event_type: string
          source_line_id?: string | null
          unit_code_snapshot?: string | null
        }
        Update: {
          business_id?: string
          catalog_item_id?: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          idempotency_key?: string
          inventory_value_delta_minor?: number
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"]
          occurred_at?: string
          quantity_delta?: number
          source_event_id?: string
          source_event_type?: string
          source_line_id?: string | null
          unit_code_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_positions: {
        Row: {
          business_id: string
          catalog_item_id: string
          created_at: string
          id: string
          initialized_at: string | null
          inventory_value_minor: number
          quantity_on_hand: number
          status: Database["public"]["Enums"]["inventory_position_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          catalog_item_id: string
          created_at?: string
          id?: string
          initialized_at?: string | null
          inventory_value_minor?: number
          quantity_on_hand?: number
          status?: Database["public"]["Enums"]["inventory_position_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          catalog_item_id?: string
          created_at?: string
          id?: string
          initialized_at?: string | null
          inventory_value_minor?: number
          quantity_on_hand?: number
          status?: Database["public"]["Enums"]["inventory_position_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_positions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_positions_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          business_id: string
          catalog_item_id: string | null
          created_at: string
          discount_minor: number
          id: string
          invoice_id: string
          item_name_snapshot: string
          item_type_snapshot: string
          line_order: number
          line_total_minor: number
          quantity: number
          sale_item_id: string | null
          sku_snapshot: string | null
          track_inventory_snapshot: boolean
          unit_code_snapshot: string
          unit_price_minor: number
        }
        Insert: {
          business_id: string
          catalog_item_id?: string | null
          created_at?: string
          discount_minor?: number
          id?: string
          invoice_id: string
          item_name_snapshot: string
          item_type_snapshot: string
          line_order?: number
          line_total_minor: number
          quantity: number
          sale_item_id?: string | null
          sku_snapshot?: string | null
          track_inventory_snapshot: boolean
          unit_code_snapshot: string
          unit_price_minor: number
        }
        Update: {
          business_id?: string
          catalog_item_id?: string | null
          created_at?: string
          discount_minor?: number
          id?: string
          invoice_id?: string
          item_name_snapshot?: string
          item_type_snapshot?: string
          line_order?: number
          line_total_minor?: number
          quantity?: number
          sale_item_id?: string | null
          sku_snapshot?: string | null
          track_inventory_snapshot?: boolean
          unit_code_snapshot?: string
          unit_price_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          business_id: string
          business_snapshot: Json | null
          created_at: string
          created_by_user_id: string | null
          currency_code: string
          customer_id: string
          customer_snapshot: Json | null
          discount_total_minor: number
          document_status: Database["public"]["Enums"]["invoice_status"]
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          issued_at: string | null
          issued_by_user_id: string | null
          notes: string | null
          sale_id: string | null
          snapshot_version: number | null
          subtotal_minor: number
          total_minor: number
          updated_at: string
          void_reason: string | null
          voided_at: string | null
          voided_by_user_id: string | null
        }
        Insert: {
          business_id: string
          business_snapshot?: Json | null
          created_at?: string
          created_by_user_id?: string | null
          currency_code: string
          customer_id: string
          customer_snapshot?: Json | null
          discount_total_minor?: number
          document_status?: Database["public"]["Enums"]["invoice_status"]
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          issued_at?: string | null
          issued_by_user_id?: string | null
          notes?: string | null
          sale_id?: string | null
          snapshot_version?: number | null
          subtotal_minor: number
          total_minor: number
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by_user_id?: string | null
        }
        Update: {
          business_id?: string
          business_snapshot?: Json | null
          created_at?: string
          created_by_user_id?: string | null
          currency_code?: string
          customer_id?: string
          customer_snapshot?: Json | null
          discount_total_minor?: number
          document_status?: Database["public"]["Enums"]["invoice_status"]
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          issued_at?: string | null
          issued_by_user_id?: string | null
          notes?: string | null
          sale_id?: string | null
          snapshot_version?: number | null
          subtotal_minor?: number
          total_minor?: number
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          business_id: string
          created_at: string
          created_by_user_id: string | null
          currency_code: string
          description: string | null
          effective_date: string
          id: string
          idempotency_key: string
          occurred_at: string
          reversal_of_entry_id: string | null
          reversed_by_entry_id: string | null
          source_event_id: string
          source_event_type: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by_user_id?: string | null
          currency_code: string
          description?: string | null
          effective_date: string
          id?: string
          idempotency_key: string
          occurred_at: string
          reversal_of_entry_id?: string | null
          reversed_by_entry_id?: string | null
          source_event_id: string
          source_event_type: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by_user_id?: string | null
          currency_code?: string
          description?: string | null
          effective_date?: string
          id?: string
          idempotency_key?: string
          occurred_at?: string
          reversal_of_entry_id?: string | null
          reversed_by_entry_id?: string | null
          source_event_id?: string
          source_event_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_reversal_of_entry_id_fkey"
            columns: ["reversal_of_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_reversed_by_entry_id_fkey"
            columns: ["reversed_by_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          business_id: string
          created_at: string
          credit_minor: number
          debit_minor: number
          id: string
          journal_entry_id: string
          ledger_account_id: string
          line_order: number | null
          memo: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          credit_minor?: number
          debit_minor?: number
          id?: string
          journal_entry_id: string
          ledger_account_id: string
          line_order?: number | null
          memo?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          credit_minor?: number
          debit_minor?: number
          id?: string
          journal_entry_id?: string
          ledger_account_id?: string
          line_order?: number | null
          memo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_ledger_account_id_fkey"
            columns: ["ledger_account_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_accounts: {
        Row: {
          account_class: string
          business_id: string
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          normal_balance: string | null
          system_key: string | null
          updated_at: string
        }
        Insert: {
          account_class: string
          business_id: string
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          normal_balance?: string | null
          system_key?: string | null
          updated_at?: string
        }
        Update: {
          account_class?: string
          business_id?: string
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          normal_balance?: string | null
          system_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_push_deliveries: {
        Row: {
          business_id: string
          created_at: string
          device_id: string | null
          error_code: string | null
          failed_at: string | null
          id: string
          idempotency_key: string
          notification_id: string
          provider_receipt_status: string | null
          provider_ticket_id: string | null
          recipient_user_id: string
          rendered_body: string
          rendered_title: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          device_id?: string | null
          error_code?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key: string
          notification_id: string
          provider_receipt_status?: string | null
          provider_ticket_id?: string | null
          recipient_user_id: string
          rendered_body: string
          rendered_title: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          device_id?: string | null
          error_code?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string
          notification_id?: string
          provider_receipt_status?: string | null
          provider_ticket_id?: string | null
          recipient_user_id?: string
          rendered_body?: string
          rendered_title?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile_push_deliveries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobile_push_deliveries_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "mobile_push_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobile_push_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "business_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_push_devices: {
        Row: {
          app_version: string | null
          created_at: string
          environment: string
          id: string
          installation_id: string
          last_seen_at: string
          permission_state: string
          platform: string
          provider: string
          push_token: string
          revoked_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          environment?: string
          id?: string
          installation_id: string
          last_seen_at?: string
          permission_state?: string
          platform: string
          provider?: string
          push_token: string
          revoked_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          environment?: string
          id?: string
          installation_id?: string
          last_seen_at?: string
          permission_state?: string
          platform?: string
          provider?: string
          push_token?: string
          revoked_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          business_id: string
          category: string
          channel: string
          created_at: string
          enabled: boolean
          id: string
          updated_at: string
          updated_by_user_id: string
          user_id: string
        }
        Insert: {
          business_id: string
          category: string
          channel?: string
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          updated_by_user_id: string
          user_id: string
        }
        Update: {
          business_id?: string
          category?: string
          channel?: string
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          updated_by_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_feature_controls: {
        Row: {
          created_at: string
          description: string
          enabled: boolean
          feature_key: string
          id: string
          updated_at: string
          updated_by_admin_id: string | null
          updated_reason: string | null
        }
        Insert: {
          created_at?: string
          description: string
          enabled?: boolean
          feature_key: string
          id?: string
          updated_at?: string
          updated_by_admin_id?: string | null
          updated_reason?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          enabled?: boolean
          feature_key?: string
          id?: string
          updated_at?: string
          updated_by_admin_id?: string | null
          updated_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_feature_controls_updated_by_admin_id_fkey"
            columns: ["updated_by_admin_id"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          preferred_locale: string
          updated_at: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string
          id: string
          last_name?: string
          phone?: string | null
          preferred_locale?: string
          updated_at?: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          preferred_locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount_minor: number
          balance_after_payment_minor: number
          business_id: string
          business_snapshot: Json
          created_at: string
          currency_code: string
          customer_snapshot: Json | null
          id: string
          invoice_number_snapshot: string | null
          payment_method_snapshot: string
          payment_occurred_at: string
          payment_reference_snapshot: string | null
          receipt_number: string
          sale_id: string
          sale_number_snapshot: string
          sale_payment_id: string
          snapshot_version: number | null
        }
        Insert: {
          amount_minor: number
          balance_after_payment_minor: number
          business_id: string
          business_snapshot: Json
          created_at?: string
          currency_code: string
          customer_snapshot?: Json | null
          id?: string
          invoice_number_snapshot?: string | null
          payment_method_snapshot: string
          payment_occurred_at: string
          payment_reference_snapshot?: string | null
          receipt_number: string
          sale_id: string
          sale_number_snapshot: string
          sale_payment_id: string
          snapshot_version?: number | null
        }
        Update: {
          amount_minor?: number
          balance_after_payment_minor?: number
          business_id?: string
          business_snapshot?: Json
          created_at?: string
          currency_code?: string
          customer_snapshot?: Json | null
          id?: string
          invoice_number_snapshot?: string | null
          payment_method_snapshot?: string
          payment_occurred_at?: string
          payment_reference_snapshot?: string | null
          receipt_number?: string
          sale_id?: string
          sale_number_snapshot?: string
          sale_payment_id?: string
          snapshot_version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_sale_payment_id_fkey"
            columns: ["sale_payment_id"]
            isOneToOne: true
            referencedRelation: "sale_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          business_id: string
          catalog_item_id: string | null
          created_at: string
          discount_minor: number
          id: string
          item_name_snapshot: string
          item_type_snapshot: string
          line_order: number
          line_total_minor: number
          quantity: number
          sale_id: string
          sku_snapshot: string | null
          track_inventory_snapshot: boolean
          unit_code_snapshot: string
          unit_price_minor: number
        }
        Insert: {
          business_id: string
          catalog_item_id?: string | null
          created_at?: string
          discount_minor?: number
          id?: string
          item_name_snapshot: string
          item_type_snapshot: string
          line_order?: number
          line_total_minor: number
          quantity: number
          sale_id: string
          sku_snapshot?: string | null
          track_inventory_snapshot: boolean
          unit_code_snapshot: string
          unit_price_minor: number
        }
        Update: {
          business_id?: string
          catalog_item_id?: string | null
          created_at?: string
          discount_minor?: number
          id?: string
          item_name_snapshot?: string
          item_type_snapshot?: string
          line_order?: number
          line_total_minor?: number
          quantity?: number
          sale_id?: string
          sku_snapshot?: string | null
          track_inventory_snapshot?: boolean
          unit_code_snapshot?: string
          unit_price_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_payments: {
        Row: {
          amount_minor: number
          business_id: string
          created_at: string
          currency_code: string
          effective_date: string
          id: string
          idempotency_key: string
          occurred_at: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          received_by_user_id: string | null
          reference: string | null
          sale_id: string
        }
        Insert: {
          amount_minor: number
          business_id: string
          created_at?: string
          currency_code: string
          effective_date: string
          id?: string
          idempotency_key: string
          occurred_at?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          received_by_user_id?: string | null
          reference?: string | null
          sale_id: string
        }
        Update: {
          amount_minor?: number
          business_id?: string
          created_at?: string
          currency_code?: string
          effective_date?: string
          id?: string
          idempotency_key?: string
          occurred_at?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          received_by_user_id?: string | null
          reference?: string | null
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_refund_items: {
        Row: {
          business_id: string
          cogs_reversal_minor: number
          created_at: string
          id: string
          quantity: number
          refund_amount_minor: number
          refund_id: string
          restocked: boolean
          sale_item_id: string
        }
        Insert: {
          business_id: string
          cogs_reversal_minor?: number
          created_at?: string
          id?: string
          quantity: number
          refund_amount_minor: number
          refund_id: string
          restocked?: boolean
          sale_item_id: string
        }
        Update: {
          business_id?: string
          cogs_reversal_minor?: number
          created_at?: string
          id?: string
          quantity?: number
          refund_amount_minor?: number
          refund_id?: string
          restocked?: boolean
          sale_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_refund_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_refund_items_refund_id_fkey"
            columns: ["refund_id"]
            isOneToOne: false
            referencedRelation: "sale_refunds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_refund_items_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_refunds: {
        Row: {
          business_id: string
          cash_refund_method:
            | Database["public"]["Enums"]["payment_method"]
            | null
          cash_refund_minor: number
          cash_refund_reference: string | null
          created_at: string
          created_by_user_id: string | null
          effective_date: string
          id: string
          idempotency_key: string
          notes: string | null
          occurred_at: string
          reason: Database["public"]["Enums"]["refund_reason"]
          receivable_reduction_minor: number
          refund_number: string
          sale_id: string
          total_minor: number
        }
        Insert: {
          business_id: string
          cash_refund_method?:
            | Database["public"]["Enums"]["payment_method"]
            | null
          cash_refund_minor?: number
          cash_refund_reference?: string | null
          created_at?: string
          created_by_user_id?: string | null
          effective_date: string
          id?: string
          idempotency_key: string
          notes?: string | null
          occurred_at?: string
          reason: Database["public"]["Enums"]["refund_reason"]
          receivable_reduction_minor?: number
          refund_number: string
          sale_id: string
          total_minor: number
        }
        Update: {
          business_id?: string
          cash_refund_method?:
            | Database["public"]["Enums"]["payment_method"]
            | null
          cash_refund_minor?: number
          cash_refund_reference?: string | null
          created_at?: string
          created_by_user_id?: string | null
          effective_date?: string
          id?: string
          idempotency_key?: string
          notes?: string | null
          occurred_at?: string
          reason?: Database["public"]["Enums"]["refund_reason"]
          receivable_reduction_minor?: number
          refund_number?: string
          sale_id?: string
          total_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_refunds_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_refunds_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          business_id: string
          created_at: string
          created_by_user_id: string | null
          currency_code: string
          customer_id: string | null
          discount_total_minor: number
          effective_date: string
          id: string
          idempotency_key: string
          notes: string | null
          occurred_at: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          refund_status: Database["public"]["Enums"]["refund_status"]
          sale_number: string
          subtotal_minor: number
          total_minor: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by_user_id?: string | null
          currency_code: string
          customer_id?: string | null
          discount_total_minor?: number
          effective_date: string
          id?: string
          idempotency_key: string
          notes?: string | null
          occurred_at?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          refund_status?: Database["public"]["Enums"]["refund_status"]
          sale_number: string
          subtotal_minor: number
          total_minor: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by_user_id?: string | null
          currency_code?: string
          customer_id?: string | null
          discount_total_minor?: number
          effective_date?: string
          id?: string
          idempotency_key?: string
          notes?: string | null
          occurred_at?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          refund_status?: Database["public"]["Enums"]["refund_status"]
          sale_number?: string
          subtotal_minor?: number
          total_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_receipt_items: {
        Row: {
          business_id: string
          catalog_item_id: string
          created_at: string
          id: string
          item_name_snapshot: string
          line_order: number
          line_total_minor: number
          quantity: number
          stock_receipt_id: string
          unit_code_snapshot: string | null
          unit_cost_minor: number
        }
        Insert: {
          business_id: string
          catalog_item_id: string
          created_at?: string
          id?: string
          item_name_snapshot: string
          line_order: number
          line_total_minor: number
          quantity: number
          stock_receipt_id: string
          unit_code_snapshot?: string | null
          unit_cost_minor: number
        }
        Update: {
          business_id?: string
          catalog_item_id?: string
          created_at?: string
          id?: string
          item_name_snapshot?: string
          line_order?: number
          line_total_minor?: number
          quantity?: number
          stock_receipt_id?: string
          unit_code_snapshot?: string | null
          unit_cost_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_receipt_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_receipt_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_receipt_items_stock_receipt_id_fkey"
            columns: ["stock_receipt_id"]
            isOneToOne: false
            referencedRelation: "stock_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_receipt_payments: {
        Row: {
          amount_minor: number
          business_id: string
          created_at: string
          currency_code: string
          effective_date: string
          id: string
          idempotency_key: string
          occurred_at: string
          paid_by_user_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference: string | null
          stock_receipt_id: string
        }
        Insert: {
          amount_minor: number
          business_id: string
          created_at?: string
          currency_code: string
          effective_date: string
          id?: string
          idempotency_key: string
          occurred_at: string
          paid_by_user_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
          stock_receipt_id: string
        }
        Update: {
          amount_minor?: number
          business_id?: string
          created_at?: string
          currency_code?: string
          effective_date?: string
          id?: string
          idempotency_key?: string
          occurred_at?: string
          paid_by_user_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
          stock_receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_receipt_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_receipt_payments_stock_receipt_id_fkey"
            columns: ["stock_receipt_id"]
            isOneToOne: false
            referencedRelation: "stock_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_receipts: {
        Row: {
          business_id: string
          created_at: string
          created_by_user_id: string | null
          currency_code: string
          effective_date: string
          id: string
          idempotency_key: string
          notes: string | null
          occurred_at: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          receipt_number: string
          status: Database["public"]["Enums"]["stock_receipt_status"]
          supplier_id: string
          supplier_reference: string | null
          total_minor: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by_user_id?: string | null
          currency_code: string
          effective_date: string
          id?: string
          idempotency_key: string
          notes?: string | null
          occurred_at: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          receipt_number: string
          status?: Database["public"]["Enums"]["stock_receipt_status"]
          supplier_id: string
          supplier_reference?: string | null
          total_minor?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by_user_id?: string | null
          currency_code?: string
          effective_date?: string
          id?: string
          idempotency_key?: string
          notes?: string | null
          occurred_at?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          receipt_number?: string
          status?: Database["public"]["Enums"]["stock_receipt_status"]
          supplier_id?: string
          supplier_reference?: string | null
          total_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_receipts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          archived_at: string | null
          business_id: string
          city: string | null
          company_name: string | null
          contact_person: string | null
          country_code: string | null
          created_at: string
          created_by_user_id: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          status: string
          supplier_type: string
          updated_at: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          archived_at?: string | null
          business_id: string
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          country_code?: string | null
          created_at?: string
          created_by_user_id?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          supplier_type: string
          updated_at?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          archived_at?: string | null
          business_id?: string
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          country_code?: string | null
          created_at?: string
          created_by_user_id?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          supplier_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connections: {
        Row: {
          active_business_context: boolean
          business_id: string
          consent_status: string
          consent_version: string
          consented_at: string
          created_at: string
          encrypted_phone: string | null
          id: string
          linked_at: string
          masked_phone: string
          opted_out_at: string | null
          phone_lookup_key: string
          provider: string
          provider_phone_number_id: string
          revoked_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_business_context?: boolean
          business_id: string
          consent_status?: string
          consent_version?: string
          consented_at?: string
          created_at?: string
          encrypted_phone?: string | null
          id?: string
          linked_at?: string
          masked_phone: string
          opted_out_at?: string | null
          phone_lookup_key: string
          provider?: string
          provider_phone_number_id: string
          revoked_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_business_context?: boolean
          business_id?: string
          consent_status?: string
          consent_version?: string
          consented_at?: string
          created_at?: string
          encrypted_phone?: string | null
          id?: string
          linked_at?: string
          masked_phone?: string
          opted_out_at?: string | null
          phone_lookup_key?: string
          provider?: string
          provider_phone_number_id?: string
          revoked_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_deliveries: {
        Row: {
          business_id: string
          channel: string
          connection_id: string | null
          created_at: string
          delivered_at: string | null
          error_code: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          idempotency_key: string
          message_type: string
          notification_id: string | null
          provider: string
          provider_message_id: string | null
          queued_at: string
          read_at: string | null
          recipient_user_id: string
          rendered_body: string
          sent_at: string | null
          status: string
          template_key: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          channel?: string
          connection_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key: string
          message_type?: string
          notification_id?: string | null
          provider?: string
          provider_message_id?: string | null
          queued_at?: string
          read_at?: string | null
          recipient_user_id: string
          rendered_body: string
          sent_at?: string | null
          status?: string
          template_key?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          channel?: string
          connection_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string
          message_type?: string
          notification_id?: string | null
          provider?: string
          provider_message_id?: string | null
          queued_at?: string
          read_at?: string | null
          recipient_user_id?: string
          rendered_body?: string
          sent_at?: string | null
          status?: string
          template_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_deliveries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_deliveries_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "business_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_link_requests: {
        Row: {
          attempts: number
          business_id: string
          code_display: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          max_attempts: number
          token_hash: string
          user_id: string
        }
        Insert: {
          attempts?: number
          business_id: string
          code_display: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          max_attempts?: number
          token_hash: string
          user_id: string
        }
        Update: {
          attempts?: number
          business_id?: string
          code_display?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_link_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_webhook_receipts: {
        Row: {
          correlation_id: string | null
          event_type: string
          id: string
          processed_at: string | null
          provider_event_id: string
          received_at: string
          recipient_phone: string | null
          sender_lookup_key: string | null
          status: string
        }
        Insert: {
          correlation_id?: string | null
          event_type: string
          id?: string
          processed_at?: string | null
          provider_event_id: string
          received_at?: string
          recipient_phone?: string | null
          sender_lookup_key?: string | null
          status?: string
        }
        Update: {
          correlation_id?: string | null
          event_type?: string
          id?: string
          processed_at?: string | null
          provider_event_id?: string
          received_at?: string
          recipient_phone?: string | null
          sender_lookup_key?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      pg_all_foreign_keys: {
        Row: {
          fk_columns: unknown[] | null
          fk_constraint_name: unknown
          fk_schema_name: unknown
          fk_table_name: unknown
          fk_table_oid: unknown
          is_deferrable: boolean | null
          is_deferred: boolean | null
          match_type: string | null
          on_delete: string | null
          on_update: string | null
          pk_columns: unknown[] | null
          pk_constraint_name: unknown
          pk_index_name: unknown
          pk_schema_name: unknown
          pk_table_name: unknown
          pk_table_oid: unknown
        }
        Relationships: []
      }
      tap_funky: {
        Row: {
          args: string | null
          is_definer: boolean | null
          is_strict: boolean | null
          is_visible: boolean | null
          kind: unknown
          langoid: unknown
          name: unknown
          oid: unknown
          owner: unknown
          returns: string | null
          returns_set: boolean | null
          schema: unknown
          volatility: string | null
        }
        Relationships: []
      }
      team_members_view: {
        Row: {
          avatar_url: string | null
          business_id: string | null
          email: string | null
          first_name: string | null
          joined_at: string | null
          last_name: string | null
          membership_id: string | null
          membership_status: string | null
          role: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _cleanup: { Args: never; Returns: boolean }
      _contract_on: { Args: { "": string }; Returns: unknown }
      _currtest: { Args: never; Returns: number }
      _db_privs: { Args: never; Returns: unknown[] }
      _extensions: { Args: never; Returns: unknown[] }
      _get: { Args: { "": string }; Returns: number }
      _get_latest: { Args: { "": string }; Returns: number[] }
      _get_note: { Args: { "": string }; Returns: string }
      _is_verbose: { Args: never; Returns: boolean }
      _prokind: { Args: { p_oid: unknown }; Returns: unknown }
      _query: { Args: { "": string }; Returns: string }
      _refine_vol: { Args: { "": string }; Returns: string }
      _retval: { Args: { "": string }; Returns: string }
      _table_privs: { Args: never; Returns: unknown[] }
      _temptypes: { Args: { "": string }; Returns: string }
      _todo: { Args: never; Returns: string }
      accept_business_invitation: {
        Args: { p_token_hash: string }
        Returns: {
          business_id: string
          created_at: string
          id: string
          membership_status: string
          role: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "business_memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      adjust_inventory: { Args: { payload: Json }; Returns: Json }
      bootstrap_super_admin: { Args: { p_email: string }; Returns: boolean }
      col_is_null:
        | {
            Args: {
              column_name: unknown
              description?: string
              schema_name: unknown
              table_name: unknown
            }
            Returns: string
          }
        | {
            Args: {
              column_name: unknown
              description?: string
              table_name: unknown
            }
            Returns: string
          }
      col_not_null:
        | {
            Args: {
              column_name: unknown
              description?: string
              schema_name: unknown
              table_name: unknown
            }
            Returns: string
          }
        | {
            Args: {
              column_name: unknown
              description?: string
              table_name: unknown
            }
            Returns: string
          }
      create_business_invitation: {
        Args: {
          p_business_id: string
          p_email: string
          p_expires_in_days?: number
          p_role: string
          p_token_hash: string
        }
        Returns: {
          business_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          last_sent_at: string | null
          role: string
          status: string
          token_hash: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "business_invitations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_business_with_owner: {
        Args: {
          address_line_1?: string
          address_line_2?: string
          city?: string
          country_code?: string
          currency_code?: string
          email?: string
          industry: string
          local_government_area?: string
          name: string
          phone?: string
          registration_number?: string
          state?: string
          tax_identifier?: string
          timezone?: string
        }
        Returns: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          country_code: string
          created_at: string
          currency_code: string
          email: string | null
          id: string
          industry: string
          legal_name: string | null
          local_government_area: string | null
          logo_path: string | null
          name: string
          phone: string | null
          registration_number: string | null
          state: string | null
          status: string
          tax_identifier: string | null
          timezone: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "businesses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_expense: { Args: { payload: Json }; Returns: Json }
      create_sale: { Args: { payload: Json }; Returns: Json }
      create_sale_refund: { Args: { payload: Json }; Returns: Json }
      create_stock_receipt: { Args: { payload: Json }; Returns: Json }
      diag:
        | {
            Args: { msg: unknown }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.diag(msg => text), public.diag(msg => anyelement). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { msg: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.diag(msg => text), public.diag(msg => anyelement). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      diag_test_name: { Args: { "": string }; Returns: string }
      do_tap:
        | { Args: never; Returns: string[] }
        | { Args: { "": string }; Returns: string[] }
      ensure_business_ledger_accounts: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      fail:
        | { Args: never; Returns: string }
        | { Args: { "": string }; Returns: string }
      findfuncs: { Args: { "": string }; Returns: string[] }
      finish: { Args: { exception_on_failure?: boolean }; Returns: string[] }
      format_type_string: { Args: { "": string }; Returns: string }
      generate_invoice_from_sale: {
        Args: { p_sale_id: string }
        Returns: string
      }
      generate_receipt_for_payment: {
        Args: { p_payment_id: string }
        Returns: undefined
      }
      get_dashboard_current_position: {
        Args: { p_business_id: string }
        Returns: Json
      }
      get_dashboard_performance_metrics: {
        Args: {
          p_business_id: string
          p_end_date: string
          p_start_date: string
        }
        Returns: Json
      }
      get_recent_activity: {
        Args: { p_business_id: string; p_limit: number }
        Returns: Json
      }
      get_sales_trend: {
        Args: {
          p_business_id: string
          p_end_date: string
          p_start_date: string
        }
        Returns: Json
      }
      has_business_role:
        | {
            Args: { allowed_roles: string[]; business_id: string }
            Returns: boolean
          }
        | {
            Args: { allowed_roles: string[]; business_id: string }
            Returns: boolean
          }
      has_unique: { Args: { "": string }; Returns: string }
      in_todo: { Args: never; Returns: boolean }
      initialize_inventory: { Args: { payload: Json }; Returns: Json }
      is_empty: { Args: { "": string }; Returns: string }
      isnt_empty: { Args: { "": string }; Returns: string }
      issue_invoice: { Args: { payload: Json }; Returns: string }
      lives_ok: { Args: { "": string }; Returns: string }
      next_business_sequence: {
        Args: { p_business_id: string; p_prefix: string }
        Returns: string
      }
      no_plan: { Args: never; Returns: boolean[] }
      num_failed: { Args: never; Returns: number }
      os_name: { Args: never; Returns: string }
      pass:
        | { Args: never; Returns: string }
        | { Args: { "": string }; Returns: string }
      pg_version: { Args: never; Returns: string }
      pg_version_num: { Args: never; Returns: number }
      pgtap_version: { Args: never; Returns: number }
      post_financial_entry: { Args: { payload: Json }; Returns: Json }
      provision_default_expense_categories: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      record_expense_payment: { Args: { payload: Json }; Returns: Json }
      record_sale_payment: { Args: { payload: Json }; Returns: Json }
      record_stock_receipt_payment: { Args: { payload: Json }; Returns: Json }
      reverse_expense: { Args: { payload: Json }; Returns: Json }
      reverse_financial_entry: {
        Args: {
          p_created_by_user_id: string
          p_idempotency_key: string
          p_original_entry_id: string
          p_reason: string
        }
        Returns: Json
      }
      revoke_business_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      runtests:
        | { Args: never; Returns: string[] }
        | { Args: { "": string }; Returns: string[] }
      save_invoice_draft: { Args: { payload: Json }; Returns: string }
      skip:
        | { Args: { "": string }; Returns: string }
        | { Args: { how_many: number; why: string }; Returns: string }
      throws_ok: { Args: { "": string }; Returns: string }
      todo:
        | { Args: { how_many: number }; Returns: boolean[] }
        | { Args: { how_many: number; why: string }; Returns: boolean[] }
        | { Args: { why: string }; Returns: boolean[] }
        | { Args: { how_many: number; why: string }; Returns: boolean[] }
      todo_end: { Args: never; Returns: boolean[] }
      todo_start:
        | { Args: never; Returns: boolean[] }
        | { Args: { "": string }; Returns: boolean[] }
      update_business_membership: {
        Args: { p_membership_id: string; p_role: string; p_status: string }
        Returns: {
          business_id: string
          created_at: string
          id: string
          membership_status: string
          role: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "business_memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_expense_status: {
        Args: { p_expense_id: string }
        Returns: undefined
      }
      update_sale_statuses: { Args: { p_sale_id: string }; Returns: undefined }
      update_stock_receipt_statuses: {
        Args: { p_receipt_id: string }
        Returns: undefined
      }
      void_invoice: {
        Args: { p_invoice_id: string; p_reason: string }
        Returns: undefined
      }
    }
    Enums: {
      billing_interval: "monthly" | "annual"
      billing_override_type:
        | "complimentary"
        | "temporary_extension"
        | "migration"
        | "internal_test"
      billing_subscription_status:
        | "pending"
        | "active"
        | "past_due"
        | "non_renewing"
        | "cancelled"
        | "inactive"
        | "complimentary"
      billing_transaction_status: "pending" | "success" | "failed"
      billing_transaction_type:
        | "initial_subscription"
        | "renewal"
        | "manual_recovery"
        | "plan_change"
      billing_webhook_status: "pending" | "processed" | "failed"
      expense_status: "posted" | "reversed"
      inventory_movement_type:
        | "opening_stock"
        | "purchase_receipt"
        | "sale_issue"
        | "sale_refund_return"
        | "adjustment_increase"
        | "adjustment_decrease"
      inventory_position_status: "pending_initialization" | "initialized"
      invoice_status: "draft" | "issued" | "voided" | "discarded"
      payment_method: "cash" | "bank_transfer" | "pos" | "other"
      payment_status: "unpaid" | "partially_paid" | "paid"
      refund_reason:
        | "customer_return"
        | "wrong_item"
        | "damaged"
        | "correction"
        | "other"
      refund_status: "none" | "partially_refunded" | "refunded"
      stock_receipt_status: "posted" | "reversed"
    }
    CompositeTypes: {
      _time_trial_type: {
        a_time: number | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      billing_interval: ["monthly", "annual"],
      billing_override_type: [
        "complimentary",
        "temporary_extension",
        "migration",
        "internal_test",
      ],
      billing_subscription_status: [
        "pending",
        "active",
        "past_due",
        "non_renewing",
        "cancelled",
        "inactive",
        "complimentary",
      ],
      billing_transaction_status: ["pending", "success", "failed"],
      billing_transaction_type: [
        "initial_subscription",
        "renewal",
        "manual_recovery",
        "plan_change",
      ],
      billing_webhook_status: ["pending", "processed", "failed"],
      expense_status: ["posted", "reversed"],
      inventory_movement_type: [
        "opening_stock",
        "purchase_receipt",
        "sale_issue",
        "sale_refund_return",
        "adjustment_increase",
        "adjustment_decrease",
      ],
      inventory_position_status: ["pending_initialization", "initialized"],
      invoice_status: ["draft", "issued", "voided", "discarded"],
      payment_method: ["cash", "bank_transfer", "pos", "other"],
      payment_status: ["unpaid", "partially_paid", "paid"],
      refund_reason: [
        "customer_return",
        "wrong_item",
        "damaged",
        "correction",
        "other",
      ],
      refund_status: ["none", "partially_refunded", "refunded"],
      stock_receipt_status: ["posted", "reversed"],
    },
  },
} as const
