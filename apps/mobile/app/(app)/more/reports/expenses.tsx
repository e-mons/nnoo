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

export default function ExpensesReportScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const [expenses, setExpenses] = useState<any[]>([]);
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

  const fetchExpenses = async () => {
    if (!activeBusiness || !startDate || !endDate) return;
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, expense_categories(name), suppliers(name)')
        .eq('business_id', activeBusiness.id)
        .neq('status', 'reversed')
        .gte('effective_date', startDate)
        .lte('effective_date', endDate)
        .order('effective_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Error fetching expenses report', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [activeBusiness, startDate, endDate])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const totalSpendMinor = expenses.reduce(
    (sum, e) => sum + (parseInt(e.total_minor, 10) || 0),
    0
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(app)/more/expenses/${item.id}` as any)}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.categoryName}>
            {item.expense_categories?.name || 'General Operating'}
          </Text>
          <Text style={styles.descText} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        <MoneyText amountMinor={item.total_minor} style={styles.price} />
      </View>

      <View style={styles.cardMid}>
        <Text style={styles.dateText}>
          {new Date(item.effective_date).toLocaleDateString()}
          {item.suppliers?.name ? ` • ${item.suppliers.name}` : ''}
        </Text>
        <Badge
          label={item.payment_status.replace(/_/g, ' ').toUpperCase()}
          variant={item.payment_status === 'paid' ? 'success' : 'warning'}
        />
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
          <Text style={styles.headerTitle}>Operating Expenses</Text>
          <Text style={styles.subtext}>Monthly Spend & Disbursements</Text>
        </View>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryBanner}>
        <View>
          <Text style={styles.summaryLabel}>Total Operating Spend</Text>
          <MoneyText amountMinor={totalSpendMinor} style={styles.summaryAmount} />
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summarySubLabel}>Vouchers Logged</Text>
          <Text style={styles.summaryCount}>{expenses.length}</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#B8F25C" />
        </View>
      ) : (
        <FlatList
          data={expenses}
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
              <Text style={styles.emptyText}>No expenses recorded for this period.</Text>
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
    borderColor: 'rgba(255, 77, 77, 0.3)',
  },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 2 },
  summaryAmount: { fontSize: 22, fontWeight: '900', color: '#FF4D4D' },
  summaryRight: { alignItems: 'flex-end' },
  summarySubLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  summaryCount: { fontSize: 18, fontWeight: '800', color: '#FFF' },

  listContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 60 },
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
  categoryName: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  descText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  price: { fontSize: 16, fontWeight: '900', color: '#FF4D4D' },

  cardMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  dateText: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },

  emptyContainer: { padding: 48, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
});
