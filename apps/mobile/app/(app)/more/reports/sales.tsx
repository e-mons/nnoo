import React, { useState, useEffect, useCallback } from 'react';
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

export default function SalesReportScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
  }, []);

  const fetchSales = async () => {
    if (!activeBusiness || !startDate || !endDate) return;
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
          refund_status,
          customers ( id, name )
        `)
        .eq('business_id', activeBusiness.id)
        .gte('effective_date', startDate)
        .lte('effective_date', endDate)
        .order('occurred_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      console.error('Error fetching sales report', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSales();
    }, [activeBusiness, startDate, endDate])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSales();
    setRefreshing(false);
  };

  const totalGrossMinor = sales.reduce(
    (sum, s) => sum + (parseInt(s.total_minor, 10) || 0),
    0
  );

  const completedSalesCount = sales.filter((s) => s.payment_status === 'paid').length;

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(app)/sales/${item.id}` as any)}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.saleNumber}>{item.sale_number}</Text>
          <Text style={styles.customerName}>
            {item.customers?.name || 'Walk-in Customer'}
          </Text>
        </View>
        <MoneyText amountMinor={item.total_minor} style={styles.price} />
      </View>

      <View style={styles.cardMid}>
        <Text style={styles.dateText}>
          {new Date(item.effective_date || item.occurred_at).toLocaleDateString()}
        </Text>
        <View style={styles.badges}>
          <Badge
            label={item.payment_status.replace('_', ' ')}
            variant={
              item.payment_status === 'paid'
                ? 'success'
                : item.payment_status === 'unpaid'
                ? 'error'
                : 'warning'
            }
          />
          {item.refund_status !== 'none' && (
            <Badge label={item.refund_status?.replace(/_/g, ' ')} variant="error" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Sales & Revenue</Text>
          <Text style={styles.subtext}>Monthly Sales Ledger</Text>
        </View>
      </View>

      {/* Summary Banner */}
      <View style={styles.summaryBanner}>
        <View>
          <Text style={styles.summaryLabel}>Total Gross Revenue</Text>
          <MoneyText amountMinor={totalGrossMinor} style={styles.summaryAmount} />
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summarySubLabel}>Orders Recorded</Text>
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
              <Feather name="shopping-bag" size={36} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No sales recorded for this period.</Text>
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
    borderColor: 'rgba(184, 242, 92, 0.25)',
  },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 4 },
  summaryAmount: { fontSize: 24, fontWeight: '900', color: '#B8F25C' },
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
  customerName: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  price: { fontSize: 16, fontWeight: '900', color: '#B8F25C' },
  cardMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  dateText: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  badges: { flexDirection: 'row', gap: 6 },

  emptyContainer: { padding: 48, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
});
