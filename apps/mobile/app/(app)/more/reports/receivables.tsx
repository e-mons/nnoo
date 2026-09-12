import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Badge } from '../../../../components/Badge';
import { MoneyText } from '../../../../components/MoneyText';

export default function ReceivablesReportScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReceivables = async () => {
    if (!activeBusiness) return;
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          sale_number,
          effective_date,
          occurred_at,
          total_minor,
          payment_status,
          customer_id,
          customers ( id, name, phone ),
          invoices ( id, invoice_number, due_date, document_status )
        `)
        .eq('business_id', activeBusiness.id)
        .neq('payment_status', 'paid')
        .gt('total_minor', 0)
        .order('occurred_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      console.error('Error fetching receivables', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReceivables();
    }, [activeBusiness])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReceivables();
    setRefreshing(false);
  };

  const totalReceivablesMinor = sales.reduce(
    (sum, s) => sum + (parseInt(s.total_minor, 10) || 0),
    0
  );

  const renderItem = ({ item }: { item: any }) => {
    const linkedInvoice = Array.isArray(item.invoices)
      ? item.invoices.find((i: any) => i.document_status !== 'voided')
      : item.invoices?.document_status !== 'voided'
      ? item.invoices
      : null;

    const isOverdue =
      linkedInvoice?.due_date && new Date(linkedInvoice.due_date) < new Date();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (linkedInvoice?.id) {
            router.push(`/(app)/invoices/${linkedInvoice.id}` as any);
          } else {
            router.push(`/(app)/sales/${item.id}` as any);
          }
        }}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.saleNumber}>
              {linkedInvoice?.invoice_number || item.sale_number}
            </Text>
            {linkedInvoice?.invoice_number ? (
              <Text style={styles.orderRefText}>Order: {item.sale_number}</Text>
            ) : null}
          </View>
          <MoneyText amountMinor={item.total_minor} style={styles.price} />
        </View>

        <View style={styles.cardMid}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerText}>
              {item.customers?.name || 'Walk-in Customer'}
            </Text>
            <Text style={styles.dateText}>
              {new Date(item.effective_date || item.occurred_at).toLocaleDateString()}
              {linkedInvoice?.due_date
                ? ` • Due: ${new Date(linkedInvoice.due_date).toLocaleDateString()}`
                : ''}
            </Text>
          </View>

          <Badge
            label={isOverdue ? 'Overdue' : item.payment_status.replace('_', ' ')}
            variant={isOverdue ? 'error' : 'warning'}
          />
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
          <Text style={styles.headerTitle}>Accounts Receivable</Text>
          <Text style={styles.subtext}>Outstanding unpaid customer balances</Text>
        </View>
      </View>

      {/* Summary Banner */}
      <View style={styles.summaryBanner}>
        <View>
          <Text style={styles.summaryLabel}>Total Outstanding Receivables</Text>
          <MoneyText amountMinor={totalReceivablesMinor} style={styles.summaryAmount} />
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summarySubLabel}>Unpaid Orders</Text>
          <Text style={styles.summaryCount}>{sales.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#B8F25C" />
        </View>
      ) : (
        <FlatList
          data={sales}
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
              <Text style={styles.emptyText}>No outstanding receivables.</Text>
              <Text style={styles.emptySubtext}>All customer accounts and invoices are settled.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: { marginRight: 14, padding: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  summaryBanner: {
    backgroundColor: '#0E291E',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.4)',
  },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 4 },
  summaryAmount: { fontSize: 24, fontWeight: '900', color: '#FF9800' },
  summaryRight: { alignItems: 'flex-end' },
  summarySubLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  summaryCount: { fontSize: 18, fontWeight: '800', color: '#FFF' },

  listContent: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 60 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  saleNumber: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  orderRefText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  price: { fontSize: 16, fontWeight: '900', color: '#FF9800' },
  cardMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  customerText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  dateText: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },

  emptyContainer: { padding: 48, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '700' },
  emptySubtext: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' },
});
