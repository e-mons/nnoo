import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { useAuth } from '../../../../context/AuthContext';
import { api } from '../../../../lib/api';

import * as Crypto from 'expo-crypto';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  user_text: string | null;
  assistant_response_payload: {
    text?: string;
    factCards?: Array<{ label: string; value: string }>;
  } | null;
  created_at: string;
};

export default function AssistantChatScreen() {
  const { id, initialPrompt } = useLocalSearchParams<{ id: string; initialPrompt?: string }>();
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const initialPromptHandled = useRef(false);

  useEffect(() => {
    if (initialPrompt && !initialPromptHandled.current) {
      initialPromptHandled.current = true;
      setInputText(initialPrompt);
    }
  }, [initialPrompt]);

  const fetchMessages = useCallback(async () => {
    if (!activeBusiness || !id) return;
    try {
      setError(null);
      const res = await api.get<any>(`/api/v1/ai/assistant/conversations/${id}`, {
        businessId: activeBusiness.id,
      });

      const turns = res?.turns || res?.data?.turns || [];
      const flatList: Message[] = [];
      turns.forEach((t: any) => {
        if (t.userMessage?.text) {
          flatList.push({
            id: `${t.id}-user`,
            role: 'user',
            user_text: t.userMessage.text,
            assistant_response_payload: null,
            created_at: t.userMessage.createdAt || new Date().toISOString(),
          });
        }
        if (t.assistantMessage?.text) {
          flatList.push({
            id: `${t.id}-assistant`,
            role: 'assistant',
            user_text: null,
            assistant_response_payload: {
              text: t.assistantMessage.text,
              factCards: t.assistantMessage.factCards,
            },
            created_at: t.assistantMessage.createdAt || new Date().toISOString(),
          });
        }
      });
      setMessages(flatList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async () => {
    if (!inputText.trim() || sending || !activeBusiness || !id) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistic user message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      user_text: text,
      assistant_response_payload: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const idempotencyKey = Crypto.randomUUID();
      const res = await api.post<{
        success: boolean;
        data?: {
          conversationId: string;
          turn: {
            id: string;
            userMessage: { text: string; createdAt: string };
            assistantMessage: { text: string; factCards?: any[]; createdAt: string };
          };
        };
      }>(`/api/v1/ai/assistant/conversations/${id}/messages`, {
        businessId: activeBusiness.id,
        message: text,
        idempotencyKey,
      });

      const turn = (res as any)?.turn || (res as any)?.data?.turn;
      if (turn) {
        const newAssistantMsg: Message = {
          id: `${turn.id}-assistant`,
          role: 'assistant',
          user_text: null,
          assistant_response_payload: {
            text: turn.assistantMessage?.text || '',
            factCards: turn.assistantMessage?.factCards,
          },
          created_at: turn.assistantMessage?.createdAt || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newAssistantMsg]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Feather name="cpu" size={14} color="#B8F25C" />
          </View>
        )}
        <View style={styles.messageContent}>
          <Text style={[styles.messageText, isUser && styles.userText]}>
            {isUser ? item.user_text : (item.assistant_response_payload?.text || '...')}
          </Text>

          {/* Fact Cards */}
          {!isUser && item.assistant_response_payload?.factCards && (
            <View style={styles.factCards}>
              {item.assistant_response_payload.factCards.map((card, i) => (
                <View key={i} style={styles.factCard}>
                  <Text style={styles.factLabel}>{card.label}</Text>
                  <Text style={styles.factValue}>{card.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Ask NNOO', headerShown: true }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#B8F25C" />
          </View>
        ) : error && messages.length === 0 ? (
          <View style={styles.center}>
            <Feather name="alert-circle" size={48} color="#F25C5C" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about your business..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#0A1C16" />
            ) : (
              <Feather name="send" size={18} color="#0A1C16" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1C16' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#F25C5C', fontSize: 14, marginTop: 12, textAlign: 'center' },
  messageList: { padding: 16, paddingBottom: 8 },
  messageBubble: { flexDirection: 'row', marginBottom: 16, maxWidth: '88%' },
  userBubble: { alignSelf: 'flex-end' },
  assistantBubble: { alignSelf: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(184,242,92,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 8, marginTop: 2 },
  messageContent: { flex: 1 },
  messageText: { fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 22, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 14 },
  userText: { backgroundColor: 'rgba(184,242,92,0.12)', color: '#FFFFFF' },
  factCards: { marginTop: 8, gap: 6 },
  factCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(184,242,92,0.08)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(184,242,92,0.15)' },
  factLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  factValue: { fontSize: 13, fontWeight: '700', color: '#B8F25C' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(184,242,92,0.1)', backgroundColor: '#06130E' },
  textInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#FFFFFF', fontSize: 15, maxHeight: 100 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#B8F25C', justifyContent: 'center', alignItems: 'center' },
  sendDisabled: { opacity: 0.4 },
});
