"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Archive,
  RefreshCw,
  Lock,
  ChevronRight,
  Database,
  BarChart3,
  Receipt,
  Package,
  Users,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import type {
  AskNnooConversationSummary,
  AskNnooMessage,
  AskNnooRenderedPayload,
  AskNnooActionKey,
} from '@nnoo/contracts';
import { ASK_NNOO_ACTION_REGISTRY } from '@nnoo/contracts';

interface AskNnooChatProps {
  businessId: string;
  businessSlug: string;
  userRole: string;
  userName: string;
}

export function AskNnooChat({
  businessId,
  businessSlug,
  userRole,
}: AskNnooChatProps) {
  const [conversations, setConversations] = useState<AskNnooConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AskNnooMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 1. Load conversations on mount
  const loadConversations = async () => {
    try {
      setErrorMsg(null);
      const res = await fetch(`/api/v1/ai/assistant/conversations?businessId=${businessId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setConversations(json.data);
        if (!activeConvId && json.data.length > 0) {
          setActiveConvId(json.data[0].id);
        }
      }
    } catch {
      setErrorMsg('Failed to load conversations.');
    }
  };

  useEffect(() => {
    loadConversations();
  }, [businessId]);

  // 2. Load messages when activeConvId changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        setIsFetchingMessages(true);
        setErrorMsg(null);
        const res = await fetch(
          `/api/v1/ai/assistant/conversations/${activeConvId}?businessId=${businessId}`
        );
        const json = await res.json();
        if (json.success && json.data) {
          setMessages(json.data.messages || []);
        } else {
          setErrorMsg(json.error?.message || 'Failed to load conversation messages.');
        }
      } catch {
        setErrorMsg('Failed to load conversation messages.');
      } finally {
        setIsFetchingMessages(false);
      }
    };

    loadMessages();
  }, [activeConvId, businessId]);

  // 3. Start a new conversation
  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // 4. Archive current conversation
  const handleArchiveConversation = async () => {
    if (!activeConvId) return;
    try {
      const res = await fetch(
        `/api/v1/ai/assistant/conversations/${activeConvId}?businessId=${businessId}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (json.success) {
        setConversations((prev) => prev.filter((c) => c.id !== activeConvId));
        handleNewConversation();
      }
    } catch {
      setErrorMsg('Failed to archive conversation.');
    }
  };

  // 5. Send message
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend || isLoading) return;

    setErrorMsg(null);
    setInputText('');

    // Optimistic user message
    const tempUserMsg: AskNnooMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConvId || 'pending',
      businessId,
      ownerUserId: 'current',
      role: 'user',
      userText: textToSend,
      assistantResponsePayload: null,
      sourceKeys: [],
      requiredCapabilities: [],
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const idempotencyKey = `ask-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const targetConvId = activeConvId || 'new';

      const res = await fetch(
        `/api/v1/ai/assistant/conversations/${targetConvId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            message: textToSend,
            idempotencyKey,
          }),
        }
      );

      const json = await res.json();
      if (json.success && json.data) {
        const { conversationId, assistantMessage } = json.data;
        if (!activeConvId) {
          setActiveConvId(conversationId);
          loadConversations();
        }
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          json.data.userMessage,
          assistantMessage,
        ]);
      } else {
        setErrorMsg(json.error?.message || 'Failed to get answer from Ask NNOO.');
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Role-aware suggested questions
  const getSuggestedQuestions = () => {
    const isOwnerOrAdmin = ['owner', 'business_admin', 'manager', 'accountant'].includes(userRole);
    const isSales = userRole === 'sales_staff';
    const isInventory = userRole === 'inventory_staff';

    if (isOwnerOrAdmin) {
      return [
        { label: 'How much did I sell this month?', query: 'How much did I sell this month?', icon: BarChart3 },
        { label: 'What is my Gross Profit & Margin?', query: 'What is my gross profit and margin this month?', icon: TrendingUp },
        { label: 'Who owes me money right now?', query: 'Who owes me money right now?', icon: Users },
        { label: 'What are my highest expenses?', query: 'What are my highest expenses this month?', icon: CreditCard },
        { label: 'Which products are low on stock?', query: 'Which products are low on stock?', icon: Package },
        { label: 'Any overdue customer invoices?', query: 'Do I have any overdue customer invoices?', icon: Receipt },
      ];
    }
    if (isSales) {
      return [
        { label: 'How much did I sell today?', query: 'How much did I sell today?', icon: BarChart3 },
        { label: 'Who owes me money?', query: 'Who owes me money?', icon: Users },
        { label: 'Lookup product prices & stock', query: 'Lookup product prices and stock levels', icon: Package },
      ];
    }
    if (isInventory) {
      return [
        { label: 'Which products are low on stock?', query: 'Which products are low on stock?', icon: Package },
        { label: 'Which items are out of stock?', query: 'Which items are completely out of stock?', icon: AlertCircle },
      ];
    }
    return [
      { label: 'How is the business performing?', query: 'How is the business doing this month?', icon: TrendingUp },
      { label: 'What products are low on stock?', query: 'Which products are low on stock?', icon: Package },
    ];
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[640px] w-full bg-[#05120D]/95 text-white overflow-hidden rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl">
      {/* 1. LEFT SIDEBAR: Conversation History */}
      <aside className="w-72 md:w-80 border-r border-white/10 bg-[#081812]/80 flex flex-col shrink-0 hidden md:flex backdrop-blur-xl">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#143628] to-[#1E4D3A] border border-[#B8F25C]/30 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-[#B8F25C]" />
            </div>
            <div>
              <h2 className="font-bold text-xs tracking-wide text-white uppercase">Ask NNOO</h2>
              <p className="text-[10px] text-white/50">History & Threads</p>
            </div>
          </div>
          <button
            onClick={handleNewConversation}
            className="flex items-center gap-1.5 text-xs bg-[#B8F25C]/15 hover:bg-[#B8F25C]/25 text-[#B8F25C] font-semibold px-3 py-1.5 rounded-xl border border-[#B8F25C]/30 transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1.5 custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/40">
              <MessageSquare className="w-8 h-8 text-white/20 mx-auto mb-2.5" />
              <p className="font-medium text-white/60">No conversations yet</p>
              <p className="mt-1 text-[11px] text-white/40">Ask a question to start!</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs flex items-center justify-between transition-all group ${
                    isActive
                      ? 'bg-[#143628] border border-[#B8F25C]/40 text-white font-medium shadow-md'
                      : 'hover:bg-white/5 text-white/70 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate min-w-0">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-[#B8F25C]' : 'text-white/40 group-hover:text-white/70'
                      }`}
                    />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition-all ${
                      isActive ? 'opacity-100 text-[#B8F25C] translate-x-0.5' : 'opacity-0 -translate-x-1 group-hover:opacity-60'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-white/10 text-[11px] text-white/50 flex items-center justify-between bg-black/20">
          <span className="flex items-center gap-1.5 font-medium text-white/60">
            <span className="w-2 h-2 rounded-full bg-[#B8F25C] animate-pulse"></span>
            Grounded & Guarded
          </span>
          <button
            onClick={loadConversations}
            title="Refresh history"
            className="p-1 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* 2. MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-full bg-[#05120D] overflow-hidden">
        {/* Top Header */}
        <header className="h-16 px-6 border-b border-white/10 bg-[#081812]/90 backdrop-blur-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#143628] to-[#1E4D3A] border border-[#B8F25C]/40 flex items-center justify-center shadow-lg shadow-black/40">
              <Sparkles className="w-5 h-5 text-[#B8F25C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm text-white">Ask NNOO Business AI</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#B8F25C]/15 text-[#B8F25C] border border-[#B8F25C]/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Ledger Facts
                </span>
              </div>
              <p className="text-[11px] text-white/50">
                Deterministic Financial Intelligence · Zero Hallucinated Numbers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeConvId && (
              <button
                onClick={handleArchiveConversation}
                className="flex items-center gap-1.5 text-xs text-white/60 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-xl border border-transparent hover:border-red-500/20 transition-all"
                title="Archive conversation"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive</span>
              </button>
            )}
            <button
              onClick={handleNewConversation}
              className="md:hidden flex items-center gap-1 text-xs bg-[#B8F25C]/15 text-[#B8F25C] font-semibold px-2.5 py-1.5 rounded-xl border border-[#B8F25C]/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-6 custom-scrollbar">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs flex items-center gap-3 shadow-lg">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isFetchingMessages ? (
            <div className="h-48 flex flex-col items-center justify-center text-xs text-white/50 gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#B8F25C]" />
              <span>Retrieving verified conversation history...</span>
            </div>
          ) : messages.length === 0 ? (
            /* Empty State with Question Suggestions */
            <div className="h-full max-w-2xl mx-auto flex flex-col justify-center items-center text-center px-4 py-8">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#143628] to-[#1E4D3A] border border-[#B8F25C]/30 flex items-center justify-center mb-4 shadow-2xl shadow-emerald-950/50">
                <Sparkles className="w-8 h-8 text-[#B8F25C]" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Ask anything about your business records</h2>
              <p className="text-xs text-white/60 max-w-md mt-1.5 mb-8 leading-relaxed">
                Ask NNOO connects directly to your verified reports, sales, inventory, and general ledger.
              </p>

              <div className="w-full text-left">
                <p className="text-[11px] font-bold text-[#B8F25C] uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  Suggested Questions
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getSuggestedQuestions().map((item, idx) => {
                    const Icon = item.icon || Sparkles;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(item.query)}
                        className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-[#143628]/60 border border-white/10 hover:border-[#B8F25C]/40 text-left transition-all group flex items-center justify-between shadow-sm hover:shadow-lg active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-[#B8F25C]/20 flex items-center justify-center shrink-0 transition-colors">
                            <Icon className="w-4 h-4 text-white/60 group-hover:text-[#B8F25C] transition-colors" />
                          </div>
                          <span className="text-xs text-white/80 group-hover:text-white font-semibold truncate">
                            {item.label}
                          </span>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-[#B8F25C] transition-colors shrink-0 ml-2" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Render Message Turns */
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                businessSlug={businessSlug}
                onSelectSuggestion={(q) => handleSendMessage(q)}
              />
            ))
          )}

          {/* Loading Indicator for Assistant Response */}
          {isLoading && (
            <div className="flex gap-3 max-w-3xl">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#143628] to-[#1E4D3A] border border-[#B8F25C]/30 flex items-center justify-center shrink-0 shadow-lg">
                <Sparkles className="w-4 h-4 text-[#B8F25C] animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white/80 flex items-center gap-2.5 shadow-lg backdrop-blur-xl">
                <RefreshCw className="w-4 h-4 animate-spin text-[#B8F25C]" />
                <span className="font-medium">Querying verified database records & formulating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/10 bg-[#081812]/90 backdrop-blur-2xl shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-center rounded-2xl bg-black/40 border border-white/15 focus-within:border-[#B8F25C]/60 focus-within:ring-1 focus-within:ring-[#B8F25C]/40 transition-all shadow-inner">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask about sales, profits, expenses, low stock, or debtors..."
                className="w-full bg-transparent px-4 py-3.5 text-xs text-white placeholder-white/40 focus:outline-none resize-none max-h-32 min-h-[46px] custom-scrollbar"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="mr-2 p-2.5 rounded-xl bg-[#B8F25C] hover:bg-[#A3D94E] disabled:opacity-30 disabled:hover:bg-[#B8F25C] text-[#0A1C16] font-bold transition-all shadow-md active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-white/40 mt-2 text-center">
              Ask NNOO answers using verified records. Direct mutations require secure confirmation workflows.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

interface MessageBubbleProps {
  message: AskNnooMessage;
  businessSlug: string;
  onSelectSuggestion?: (question: string) => void;
}

function MessageBubble({ message, businessSlug, onSelectSuggestion }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-xl rounded-3xl rounded-tr-sm bg-gradient-to-r from-[#143628] to-[#1E4D3A] border border-[#B8F25C]/25 px-5 py-3.5 text-xs text-white shadow-xl">
          <p className="whitespace-pre-wrap leading-relaxed font-medium">{message.userText}</p>
          <span className="block text-[10px] text-white/50 text-right mt-1.5">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  }

  const payload = message.assistantResponsePayload as AskNnooRenderedPayload | null;

  return (
    <div className="flex gap-3 max-w-3xl">
      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#143628] to-[#1E4D3A] border border-[#B8F25C]/30 flex items-center justify-center shrink-0 shadow-lg">
        <Sparkles className="w-4 h-4 text-[#B8F25C]" />
      </div>

      <div className="flex-1 space-y-2.5 min-w-0">
        <div className="p-5 rounded-3xl rounded-tl-sm bg-[#143628]/40 border border-white/10 text-xs text-white/90 space-y-4 shadow-xl backdrop-blur-xl">
          {/* Redacted for role downgrade */}
          {payload?.isRedactedByRoleDowngrade ? (
            <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{payload.headline}</span>
            </div>
          ) : (
            <>
              {/* Headline */}
              {payload?.headline && (
                <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <TrendingUp className="w-4 h-4 text-[#B8F25C]" />
                  <span>{payload.headline}</span>
                </h3>
              )}

              {/* Narrative Segments */}
              {payload?.segments && payload.segments.length > 0 && (
                <div className="leading-relaxed space-y-2">
                  <p className="whitespace-pre-wrap">
                    {payload.segments.map((seg, idx) => {
                      if (seg.type === 'FACT') {
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 mx-1 rounded-lg bg-[#B8F25C]/15 border border-[#B8F25C]/30 text-[#B8F25C] font-bold"
                          >
                            {seg.formattedValue || seg.label}
                          </span>
                        );
                      }
                      if (seg.type === 'SAFE_ENTITY_LABEL') {
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md bg-white/10 text-white font-medium underline decoration-[#B8F25C]/40"
                          >
                            {seg.label}
                          </span>
                        );
                      }
                      return <span key={idx}>{seg.text}</span>;
                    })}
                  </p>
                </div>
              )}

              {/* Fact Metric Cards Grid */}
              {payload?.facts && payload.facts.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  {payload.facts.map((fact) => (
                    <div
                      key={fact.key}
                      className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between shadow-inner"
                    >
                      <span className="text-[10px] text-white/50 truncate font-medium">{fact.label}</span>
                      <span className="text-sm font-bold text-[#B8F25C] mt-1 truncate">
                        {fact.formattedValue}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Entity References */}
              {payload?.entities && payload.entities.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    Referenced Business Records
                  </span>
                  <div className="space-y-1.5">
                    {payload.entities.map((entity) => (
                      <div
                        key={entity.key}
                        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-white/90">{entity.displayName}</span>
                        {entity.secondaryInfo && (
                          <span className="text-[11px] text-white/50">{entity.secondaryInfo}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {payload?.actionKeys && payload.actionKeys.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {payload.actionKeys.map((key) => {
                    const actionDef = ASK_NNOO_ACTION_REGISTRY[key as AskNnooActionKey];
                    if (!actionDef) return null;
                    return (
                      <Link
                        key={key}
                        href={`/app/${businessSlug}${actionDef.routePath}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#B8F25C]/15 hover:bg-[#B8F25C]/25 border border-[#B8F25C]/30 text-[#B8F25C] text-xs font-semibold transition-all active:scale-95 shadow-sm"
                      >
                        <span>{actionDef.label}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Follow-up question chips */}
              {payload?.followUpQuestions && payload.followUpQuestions.length > 0 && onSelectSuggestion && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <span className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">Suggested Next Questions:</span>
                  <div className="flex flex-wrap gap-2">
                    {payload.followUpQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSelectSuggestion(q)}
                        className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 hover:bg-[#B8F25C]/15 border border-white/10 hover:border-[#B8F25C]/30 text-white/80 hover:text-[#B8F25C] transition-all font-medium active:scale-95"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Timestamp & Provenance */}
        <div className="flex items-center gap-2 px-1 text-[10px] text-white/40">
          <Clock className="w-3 h-3" />
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {payload?.sourceKeys && payload.sourceKeys.length > 0 && (
            <span className="text-white/40">· Source: {payload.sourceKeys.join(', ')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
