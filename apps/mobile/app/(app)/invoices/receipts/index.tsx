import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { MoneyText } from '../../../../components/MoneyText';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function CustomerReceiptsIndexScreen() {
  const { activeBusiness } = useBusiness();
  const router = useRouter();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchReceipts = async () => {
    if (!activeBusiness) return;
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          id,
          receipt_number,
          sale_number_snapshot,
          invoice_number_snapshot,
          amount_minor,
          payment_method_snapshot,
          payment_occurred_at,
          customer_snapshot,
          balance_after_payment_minor
        `)
        .eq('business_id', activeBusiness.id)
        .order('payment_occurred_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReceipts(data || []);
    } catch (err: any) {
      console.error('Error fetching receipts:', err);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [activeBusiness]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReceipts();
    setRefreshing(false);
  };

  const filteredReceipts = receipts.filter((r) => {
    const num = r.receipt_number?.toLowerCase() || '';
    const saleNum = r.sale_number_snapshot?.toLowerCase() || '';
    const cust = r.customer_snapshot?.name?.toLowerCase() || '';
    const q = search.toLowerCase();
    return num.includes(q) || saleNum.includes(q) || cust.includes(q);
  });

  const renderItem = ({ item }: { item: any }) => {
    const custName = item.customer_snapshot?.name || 'Walk-in Customer';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/invoices/receipts/${item.id}` as any)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.receiptNumber}>{item.receipt_number}</Text>
          <MoneyText amountMinor={item.amount_minor} style={styles.amount} />
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.customerName}>{custName}</Text>
          <View style={styles.methodBadge}>
            <Text style={styles.methodText}>
              {item.payment_method_snapshot?.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateText}>
            Paid: {new Date(item.payment_occurred_at).toLocaleDateString()}
          </Text>
          <Text style={styles.saleRefText}>
            Order: {item.sale_number_snapshot}
            {item.invoice_number_snapshot ? ` • ${item.invoice_number_snapshot}` : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Customer Receipts</Text>
          <Text style={styles.subtext}>Official verified payment receipts</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search receipt #, order #, or customer..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredReceipts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#B8F25C"
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="check-circle" size={36} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No customer payment receipts found.</Text>
            <Text style={styles.emptySubtext}>
              Receipts are generated automatically whenever a customer payment is recorded.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  backButton: { marginRight: 14, padding: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  searchSection: { paddingHorizontal: 20, marginBottom: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 10,
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 14 },

  listContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  receiptNumber: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  amount: { fontSize: 18, fontWeight: '900', color: '#B8F25C' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  methodBadge: {
    backgroundColor: 'rgba(184, 242, 92, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.3)',
  },
  methodText: { color: '#B8F25C', fontSize: 11, fontWeight: '800' },

  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 8,
    marginTop: 4,
  },
  dateText: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  saleRefText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  emptyContainer: { padding: 48, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '700' },
  emptySubtext: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
