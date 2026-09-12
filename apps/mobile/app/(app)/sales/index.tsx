import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { MoneyText } from '../../../components/MoneyText';
import { Badge } from '../../../components/Badge';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function SalesIndexScreen() {
  const { activeBusiness } = useBusiness();
  const [sales, setSales] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid' | 'partially_paid' | 'refunded'>('all');
  const router = useRouter();

  const fetchSales = async () => {
    if (!activeBusiness) return;
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          sale_number,
          total_minor,
          payment_status,
          refund_status,
          occurred_at,
          created_at,
          customers ( id, name )
        `)
        .eq('business_id', activeBusiness.id)
        .order('occurred_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      console.error('Error fetching sales', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSales();
    }, [activeBusiness])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSales();
    setRefreshing(false);
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalVolumeMinor = sales.reduce((sum, s) => sum + (parseInt(s.total_minor, 10) || 0), 0);
    const unpaidCount = sales.filter((s) => s.payment_status === 'unpaid' || s.payment_status === 'partially_paid').length;
    const refundedCount = sales.filter((s) => s.refund_status === 'refunded' || s.refund_status === 'partially_refunded').length;
    return {
      totalVolumeMinor,
      totalCount: sales.length,
      unpaidCount,
      refundedCount,
    };
  }, [sales]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchesSearch =
        s.sale_number?.toLowerCase().includes(search.toLowerCase()) ||
        (s.customers?.name && s.customers.name.toLowerCase().includes(search.toLowerCase()));

      let matchesFilter = true;
      if (filter === 'paid') matchesFilter = s.payment_status === 'paid';
      else if (filter === 'unpaid') matchesFilter = s.payment_status === 'unpaid';
      else if (filter === 'partially_paid') matchesFilter = s.payment_status === 'partially_paid';
      else if (filter === 'refunded') matchesFilter = s.refund_status === 'refunded' || s.refund_status === 'partially_refunded';

      return matchesSearch && matchesFilter;
    });
  }, [sales, search, filter]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(app)/sales/${item.id}` as any)}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <View style={styles.saleNumberRow}>
          <Feather name="file-text" size={16} color="#B8F25C" style={{ marginRight: 6 }} />
          <Text style={styles.saleNumber}>{item.sale_number}</Text>
        </View>
        <MoneyText amountMinor={item.total_minor} style={styles.amount} />
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.customerInfoRow}>
          <Feather name="user" size={13} color="rgba(255,255,255,0.4)" style={{ marginRight: 4 }} />
          <Text style={styles.customerName} numberOfLines={1}>
            {item.customers?.name || 'Walk-in Customer'}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          {item.refund_status && item.refund_status !== 'none' && (
            <Badge
              label={item.refund_status === 'refunded' ? 'Refunded' : 'Partial Refund'}
              variant="error"
            />
          )}
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
        </View>
      </View>

      <View style={styles.dateRow}>
        <Feather name="clock" size={12} color="rgba(255,255,255,0.3)" style={{ marginRight: 4 }} />
        <Text style={styles.date}>
          {new Date(item.occurred_at || item.created_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sales & Receipts</Text>
        <Text style={styles.subtext}>Point of sale, credit sales & order history</Text>
      </View>

      {/* Quick Metrics Summary Banner */}
      <View style={styles.metricsBanner}>
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>Total Sales</Text>
          <Text style={styles.metricValue}>{metrics.totalCount}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>Total Volume</Text>
          <MoneyText amountMinor={metrics.totalVolumeMinor} style={styles.metricMoney} />
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>Unpaid / Credit</Text>
          <Text style={[styles.metricValue, metrics.unpaidCount > 0 ? { color: '#FF9800' } : null]}>
            {metrics.unpaidCount}
          </Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by sale # or customer..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'all', label: 'All Sales' },
            { key: 'paid', label: 'Paid' },
            { key: 'unpaid', label: 'Unpaid' },
            { key: 'partially_paid', label: 'Partial' },
            { key: 'refunded', label: 'Refunded' },
          ].map((chip) => (
            <TouchableOpacity
              key={chip.key}
              style={[styles.filterChip, filter === chip.key && styles.filterChipActive]}
              onPress={() => setFilter(chip.key as any)}
            >
              <Text style={[styles.filterChipText, filter === chip.key && styles.filterChipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sales List */}
      <FlatList
        data={filteredSales}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="shopping-bag" size={40} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyTitle}>No sales found</Text>
            <Text style={styles.emptyText}>
              {search || filter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Create your first sale using the + button.'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/sales/new')}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={28} color="#0A1C16" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  title: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  metricsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E291E',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.2)',
  },
  metricCol: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: 2 },
  metricValue: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  metricMoney: { fontSize: 15, fontWeight: '900', color: '#B8F25C' },
  metricDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },

  searchSection: { paddingHorizontal: 20, marginTop: 4, marginBottom: 8 },
  searchBox: {
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

  filterSection: { marginBottom: 8 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    backgroundColor: '#B8F25C',
    borderColor: '#B8F25C',
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  filterChipTextActive: { color: '#0A1C16', fontWeight: '700' },

  listContent: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 120 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  saleNumberRow: { flexDirection: 'row', alignItems: 'center' },
  saleNumber: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  amount: { fontSize: 17, fontWeight: '800', color: '#B8F25C' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerInfoRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  customerName: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  badgeRow: { flexDirection: 'row', gap: 6 },

  dateRow: { flexDirection: 'row', alignItems: 'center' },
  date: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },

  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#B8F25C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
});
