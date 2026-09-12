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

export default function PayablesReportScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayables = async () => {
    if (!activeBusiness) return;
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(
          'id, expense_number, description, effective_date, total_minor, payment_status, status, suppliers(name), expense_categories(name)'
        )
        .eq('business_id', activeBusiness.id)
        .neq('status', 'reversed')
        .neq('payment_status', 'paid')
        .gt('total_minor', 0)
        .order('effective_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Error fetching payables', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPayables();
    }, [activeBusiness])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayables();
  };

  const totalOutstandingMinor = expenses.reduce(
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
          <Text style={styles.expenseNumber}>{item.expense_number}</Text>
          <Text style={styles.supplierText}>
            {item.suppliers?.name || 'Walk-up / Unknown'}
          </Text>
        </View>
        <MoneyText amountMinor={item.total_minor} style={styles.price} />
      </View>

      <View style={styles.cardMid}>
        <Text style={styles.dateText}>
          Due since {new Date(item.effective_date).toLocaleDateString()}
        </Text>
        <Badge
          label={item.payment_status.replace(/_/g, ' ').toUpperCase()}
          variant="warning"
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
          <Text style={styles.headerTitle}>Accounts Payable</Text>
          <Text style={styles.subtext}>Outstanding supplier bills</Text>
        </View>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryBanner}>
        <View>
          <Text style={styles.summaryLabel}>Total Unpaid Payables</Text>
          <MoneyText amountMinor={totalOutstandingMinor} style={styles.summaryAmount} />
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summarySubLabel}>Pending Vouchers</Text>
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
              <Feather name="check-circle" size={36} color="#B8F25C" />
              <Text style={styles.emptyText}>All supplier accounts are fully settled!</Text>
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
    marginBottom: 14,
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 2 },
  summaryAmount: { fontSize: 22, fontWeight: '900', color: '#FF9800' },
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
  expenseNumber: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  supplierText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  price: { fontSize: 16, fontWeight: '900', color: '#FF9800' },

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
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },
});
