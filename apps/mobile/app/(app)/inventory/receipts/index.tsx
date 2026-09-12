import React, { useState, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { MoneyText } from '../../../../components/MoneyText';
import { Badge } from '../../../../components/Badge';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function StockReceiptsIndexScreen() {
  const { activeBusiness } = useBusiness();
  const router = useRouter();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchReceipts = async () => {
    if (!activeBusiness) return;
    try {
      const { data, error } = await supabase
        .from('stock_receipts')
        .select(`
          id,
          receipt_number,
          supplier_reference,
          total_minor,
          payment_status,
          status,
          effective_date,
          occurred_at,
          suppliers ( id, name )
        `)
        .eq('business_id', activeBusiness.id)
        .order('occurred_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReceipts(data || []);
    } catch (err: any) {
      console.error('Error fetching stock receipts:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReceipts();
    }, [activeBusiness])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReceipts();
    setRefreshing(false);
  };

  const filteredReceipts = receipts.filter((r) => {
    const num = r.receipt_number?.toLowerCase() || '';
    const supplier = r.suppliers?.name?.toLowerCase() || '';
    const ref = r.supplier_reference?.toLowerCase() || '';
    const q = search.toLowerCase();
    return num.includes(q) || supplier.includes(q) || ref.includes(q);
  });

  const renderItem = ({ item }: { item: any }) => {
    const isPaid = item.payment_status === 'paid';
    const isPartial = item.payment_status === 'partially_paid';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/inventory/receipts/${item.id}` as any)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.receiptNumber}>{item.receipt_number}</Text>
          <MoneyText amountMinor={item.total_minor} style={styles.amount} />
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.supplierName}>
            {item.suppliers?.name || 'Walk-up Supplier'}
          </Text>
          <Badge
            label={isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid'}
            variant={isPaid ? 'success' : isPartial ? 'warning' : 'error'}
          />
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateText}>
            Date: {new Date(item.effective_date || item.occurred_at).toLocaleDateString()}
          </Text>
          {item.supplier_reference ? (
            <Text style={styles.refText}>Ref: {item.supplier_reference}</Text>
          ) : null}
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
          <Text style={styles.headerTitle}>Purchase Receipts</Text>
          <Text style={styles.subtext}>Stock shipments received from suppliers</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search receipt #, supplier, or ref..."
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="truck" size={36} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No purchase receipts found.</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to receive a new stock shipment.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/inventory/receipts/new' as any)}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={28} color="#0A1C16" />
      </TouchableOpacity>
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

  listContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 130 },
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
  supplierName: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

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
  refText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  emptyContainer: { padding: 48, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '700' },
  emptySubtext: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', lineHeight: 18 },

  fab: {
    position: 'absolute',
    bottom: 96,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#B8F25C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
});
