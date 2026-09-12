import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';

type Conversation = {
  id: string;
  title: string;
  last_message_at: string;
  status: string;
};

export default function AssistantListScreen() {
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!activeBusiness || !user) return;
    try {
      setError(null);
      const { data, error: queryError } = await supabase
        .from('ai_conversations')
        .select('id, title, last_message_at, status')
        .eq('business_id', activeBusiness.id)
        .eq('owner_user_id', user.id)
        .eq('status', 'ACTIVE')
        .order('last_message_at', { ascending: false })
        .limit(50);

      if (queryError) throw queryError;
      setConversations(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const startNewConversation = async (initialQuery?: string) => {
    if (!activeBusiness || !user) return;
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          business_id: activeBusiness.id,
          owner_user_id: user.id,
          title: initialQuery || 'New Conversation',
          status: 'ACTIVE',
        })
        .select('id')
        .single();

      if (error) throw error;
      if (initialQuery) {
        router.push({
          pathname: `/(app)/intelligence/assistant/${data.id}`,
          params: { initialPrompt: initialQuery },
        });
      } else {
        router.push(`/(app)/intelligence/assistant/${data.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    }
  };

  const EXAMPLE_STARTERS = [
    'How are my sales this week?',
    'What are my top expenses?',
    'Which invoices are overdue?',
    'How is my inventory doing?',
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Ask NNOO', headerShown: true }} />
      <View style={styles.container}>
        {/* New conversation button */}
        <TouchableOpacity style={styles.newButton} onPress={() => startNewConversation()}>
          <Feather name="plus" size={20} color="#0A1C16" />
          <Text style={styles.newButtonText}>New Conversation</Text>
        </TouchableOpacity>

        {/* Example starters */}
        {conversations.length === 0 && !loading && (
          <View style={styles.startersSection}>
            <Text style={styles.startersTitle}>Try asking...</Text>
            {EXAMPLE_STARTERS.map((starter, i) => (
              <TouchableOpacity key={i} style={styles.starterCard} onPress={() => startNewConversation(starter)}>
                <Feather name="message-circle" size={16} color="#5CB8F2" />
                <Text style={styles.starterText}>{starter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#B8F25C" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Feather name="alert-circle" size={48} color="#F25C5C" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : conversations.length > 0 ? (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.convCard}
                onPress={() => router.push(`/(app)/intelligence/assistant/${item.id}`)}
              >
                <View style={styles.convIcon}>
                  <Feather name="message-circle" size={18} color="#5CB8F2" />
                </View>
                <View style={styles.convContent}>
                  <Text style={styles.convTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.convDate}>
                    {new Date(item.last_message_at).toLocaleDateString()}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            )}
          />
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1C16', padding: 16 },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B8F25C',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },
  newButtonText: { fontSize: 15, fontWeight: '700', color: '#0A1C16' },
  startersSection: { marginBottom: 24 },
  startersTitle: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 12 },
  starterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(92,184,242,0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(92,184,242,0.15)',
  },
  starterText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', flex: 1 },
  list: { gap: 8 },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  convIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(92,184,242,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  convContent: { flex: 1 },
  convTitle: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  convDate: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#F25C5C', fontSize: 14, marginTop: 12, textAlign: 'center' },
});
