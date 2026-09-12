import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Badge } from '../../../../components/Badge';
import { MoneyText } from '../../../../components/MoneyText';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function ExpensesIndexScreen() {
  const { activeBusiness } = useBusiness();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'reversed'>('all');
  const router = useRouter();

  const fetchExpenses = async () => {
    if (!activeBusiness) return;
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_categories(name),
          suppliers(name)
        `)
        .eq('business_id', activeBusiness.id)
        .order('occurred_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Error fetching expenses', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [activeBusiness])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
  };

  const getStatusBadgeVariant = (status: string, paymentStatus: string) => {
    if (status === 'reversed') return 'error';
    if (paymentStatus === 'paid') return 'success';
    if (paymentStatus === 'partially_paid') return 'warning';
    return 'error';
  };

  const getStatusLabel = (status: string, paymentStatus: string) => {
    if (status === 'reversed') return 'Reversed';
    if (paymentStatus === 'paid') return 'Paid';
    if (paymentStatus === 'partially_paid') return 'Partial';
    return 'Unpaid';
  };

  const filteredExpenses = expenses.filter((e) => {
    const desc = (e.description || '').toLowerCase();
    const expNum = (e.expense_number || '').toLowerCase();
    const cat = (e.expense_categories?.name || '').toLowerCase();
    const sup = (e.suppliers?.name || '').toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch =
      desc.includes(q) || expNum.includes(q) || cat.includes(q) || sup.includes(q);

    if (!matchesSearch) return false;

    if (filter === 'unpaid') {
      return e.status !== 'reversed' && e.payment_status !== 'paid';
    }
    if (filter === 'paid') {
      return e.status !== 'reversed' && e.payment_status === 'paid';
    }
    if (filter === 'reversed') {
      return e.status === 'reversed';
    }
    return true;
  });

  const totalExpenseMinor = expenses
    .filter((e) => e.status !== 'reversed')
    .reduce((sum, e) => sum + (parseInt(e.total_minor, 10) || 0), 0);

  const totalUnpaidMinor = expenses
    .filter((e) => e.status !== 'reversed' && e.payment_status !== 'paid')
    .reduce((sum, e) => sum + (parseInt(e.total_minor, 10) || 0), 0);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(app)/more/expenses/${item.id}` as any)}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.expenseNumber}>{item.expense_number}</Text>
          <Text style={styles.expenseDesc} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        <MoneyText amountMinor={item.total_minor} style={styles.price} />
      </View>

      <View style={styles.cardMid}>
        <View style={{ flex: 1 }}>
          <Text style={styles.categoryText}>
            {item.expense_categories?.name || 'General Expense'}
          </Text>
          <Text style={styles.dateText}>
            {new Date(item.effective_date).toLocaleDateString()}
            {item.suppliers?.name ? ` • ${item.suppliers.name}` : ''}
          </Text>
        </View>
        <Badge
          label={getStatusLabel(item.status, item.payment_status)}
          variant={getStatusBadgeVariant(item.status, item.payment_status)}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Business Expenses</Text>
          <Text style={styles.subtext}>Operational spend & payables</Text>
        </View>
      </View>

      {/* Summary Banner */}
      <View style={styles.summaryBanner}>
        <View>
          <Text style={styles.summaryLabel}>Total Spend</Text>
          <MoneyText amountMinor={totalExpenseMinor} style={styles.summaryAmount} />
        </View>
        {totalUnpaidMinor > 0 && (
          <View style={styles.summaryRight}>
            <Text style={styles.summarySubLabel}>Pending Payables</Text>
            <MoneyText amountMinor={totalUnpaidMinor} style={styles.summaryUnpaidAmount} />
          </View>
        )}
      </View>

      {/* Search & Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search description, supplier, category..."
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

        <View style={styles.filterRow}>
          {[
            { key: 'all', label: `All (${expenses.length})` },
            { key: 'unpaid', label: 'Unpaid / Due' },
            { key: 'paid', label: 'Paid' },
            { key: 'reversed', label: 'Reversed' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key as any)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === f.key && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#B8F25C" />
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
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
              <Feather name="credit-card" size={36} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No expenses found.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/more/expenses/new' as any)}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={28} color="#0A1C16" />
      </TouchableOpacity>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    marginRight: 14,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },

  summaryBanner: {
    backgroundColor: '#0E291E',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 10,
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
  },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 2 },
  summaryAmount: { fontSize: 22, fontWeight: '900', color: '#B8F25C' },
  summaryRight: { alignItems: 'flex-end' },
  summarySubLabel: { fontSize: 11, color: 'rgba(255, 152, 0, 0.8)', marginBottom: 2, fontWeight: '600' },
  summaryUnpaidAmount: { fontSize: 18, fontWeight: '900', color: '#FF9800' },

  searchSection: { paddingHorizontal: 20, marginTop: 4, marginBottom: 8 },
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

  filterRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  filterChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  filterChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { color: '#0A1C16' },

  listContent: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 120 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
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
  expenseNumber: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  expenseDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  price: { fontSize: 16, fontWeight: '900', color: '#B8F25C' },

  cardMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  categoryText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  dateText: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },

  emptyContainer: { padding: 48, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },

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
