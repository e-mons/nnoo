import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { supabase } from '../../../../lib/supabase';

type ClassificationItem = {
  id: string;
  description: string;
  operation_kind: string;
  confidence_band: string;
  classification_status: string;
  amount_minor: number | null;
  currency_code: string;
  created_at: string;
};

const STATUS_TABS = ['pending_review', 'applied', 'rejected'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const TAB_LABELS: Record<StatusTab, string> = {
  pending_review: 'Pending',
  applied: 'Confirmed',
  rejected: 'Rejected',
};

export default function BookkeeperInboxScreen() {
  const { activeBusiness } = useBusiness();
  const [items, setItems] = useState<ClassificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<StatusTab>('pending_review');
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      setError(null);
      const statusVariants = [activeTab, activeTab.toUpperCase()];
      if (activeTab === 'applied') statusVariants.push('CONFIRMED', 'confirmed');

      const { data, error: queryError } = await supabase
        .from('ai_bookkeeping_classifications')
        .select('id, description, operation_kind, confidence_band, classification_status, amount_minor, currency_code, created_at')
        .eq('business_id', activeBusiness.id)
        .in('classification_status', statusVariants)
        .is('superseded_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (queryError) throw queryError;
      setItems(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load classifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBusiness, activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchItems();
  }, [fetchItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const formatAmount = (amountMinor: number | null, currency: string) => {
    if (amountMinor === null) return '—';
    return `${currency} ${(amountMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const getConfidenceColor = (band: string) => {
    switch (band) {
      case 'HIGH': return '#B8F25C';
      case 'MEDIUM': return '#F2C85C';
      case 'LOW': return '#F25C5C';
      default: return '#888';
    }
  };

  const renderItem = ({ item }: { item: ClassificationItem }) => (
    <TouchableOpacity
      style={styles.itemCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/(app)/intelligence/bookkeeper/${item.id}`)}
    >
      <View style={styles.itemHeader}>
        <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(item.confidence_band) + '20' }]}>
          <Text style={[styles.confidenceText, { color: getConfidenceColor(item.confidence_band) }]}>
            {item.confidence_band}
          </Text>
        </View>
        <Text style={styles.itemOperation}>{item.operation_kind.replace(/_/g, ' ')}</Text>
      </View>
      <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
      <View style={styles.itemFooter}>
        <Text style={styles.itemAmount}>{formatAmount(item.amount_minor, item.currency_code)}</Text>
        <Text style={styles.itemDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'AI Bookkeeper', headerShown: true }} />
      <View style={styles.container}>
        <View style={styles.tabBar}>
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {TAB_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#B8F25C" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Feather name="alert-circle" size={48} color="#F25C5C" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Feather name="check-circle" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No {TAB_LABELS[activeTab].toLowerCase()} classifications</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1C16' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  activeTab: { backgroundColor: '#B8F25C' },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  activeTabText: { color: '#0A1C16' },
  list: { padding: 16, gap: 12 },
  itemCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.08)',
    marginBottom: 12,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  confidenceBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  confidenceText: { fontSize: 11, fontWeight: '700' },
  itemOperation: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  itemDescription: { fontSize: 15, color: '#FFFFFF', lineHeight: 20, marginBottom: 12 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  itemAmount: { fontSize: 16, fontWeight: '700', color: '#B8F25C' },
  itemDate: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  errorText: { color: '#F25C5C', fontSize: 14, marginTop: 12, textAlign: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 15, marginTop: 12 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#B8F25C', borderRadius: 12 },
  retryText: { color: '#0A1C16', fontWeight: '700', fontSize: 14 },
});
