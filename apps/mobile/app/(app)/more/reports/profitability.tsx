import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function ProfitabilityReportScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const [metrics, setMetrics] = useState<any>(null);
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

  const fetchMetrics = async () => {
    if (!activeBusiness || !startDate || !endDate) return;
    try {
      const { data, error } = await supabase.rpc('get_dashboard_performance_metrics', {
        p_business_id: activeBusiness.id,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;
      setMetrics(data || {});
    } catch (err) {
      console.error('Error fetching profitability metrics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMetrics();
    }, [activeBusiness, startDate, endDate])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMetrics();
    setRefreshing(false);
  };

  const formatMoney = (minor: number | string | undefined) => {
    if (minor === undefined) return '0.00';
    const minorNum = typeof minor === 'string' ? parseInt(minor, 10) : minor;
    const amount = minorNum / 100;
    return `${(activeBusiness as any)?.currency_code || 'NGN'} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Profitability (P&L)</Text>
          <Text style={styles.subtext}>Income & Expenditure Statement</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#B8F25C" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#B8F25C"
            />
          }
        >
          {/* Net Result Card */}
          <View style={styles.heroResultCard}>
            <Text style={styles.heroLabel}>Net Operating Result</Text>
            <Text
              style={[
                styles.heroAmount,
                parseInt(String(metrics?.operatingResultMinor || '0'), 10) < 0 && {
                  color: '#FF4D4D',
                },
              ]}
            >
              {formatMoney(metrics?.operatingResultMinor)}
            </Text>
            <Text style={styles.heroDate}>
              Current Month: {startDate} to {endDate}
            </Text>
          </View>

          {/* Statement Breakdown Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Statement of Profit & Loss</Text>

            {/* Trading Revenue */}
            <View style={styles.row}>
              <Text style={styles.label}>Gross Sales Revenue</Text>
              <Text style={styles.value}>{formatMoney(metrics?.grossSalesMinor)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Less: Customer Refunds</Text>
              <Text style={[styles.value, { color: '#FF4D4D' }]}>
                ({formatMoney(metrics?.refundsMinor)})
              </Text>
            </View>

            <View style={[styles.row, styles.borderTop, styles.marginTop]}>
              <Text style={styles.boldLabel}>Net Sales</Text>
              <Text style={styles.boldValue}>{formatMoney(metrics?.netSalesMinor)}</Text>
            </View>

            {/* Cost of Goods */}
            <View style={[styles.row, styles.marginTop]}>
              <Text style={styles.label}>Cost of Goods Sold (COGS)</Text>
              <Text style={styles.value}>{formatMoney(metrics?.cogsMinor)}</Text>
            </View>

            <View style={[styles.row, styles.borderTop, styles.marginTop]}>
              <Text style={[styles.boldLabel, { fontSize: 17, color: '#B8F25C' }]}>
                Gross Profit
              </Text>
              <Text style={[styles.boldValue, { fontSize: 17, color: '#B8F25C' }]}>
                {formatMoney(metrics?.grossProfitMinor)}
              </Text>
            </View>

            {/* Operating Expenses */}
            <View style={[styles.sectionDivider, styles.marginTop]}>
              <Text style={styles.sectionHeading}>OPERATING EXPENSES</Text>
            </View>

            <View style={[styles.row, styles.marginTop]}>
              <Text style={styles.label}>Total Operating Expenses</Text>
              <Text style={styles.value}>
                {formatMoney(metrics?.operatingExpensesMinor)}
              </Text>
            </View>

            {parseInt(String(metrics?.inventoryShrinkageLossMinor || '0'), 10) > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Inventory Shrinkage Loss</Text>
                <Text style={[styles.value, { color: '#FF4D4D' }]}>
                  {formatMoney(metrics?.inventoryShrinkageLossMinor)}
                </Text>
              </View>
            )}

            {parseInt(String(metrics?.inventoryAdjustmentGainMinor || '0'), 10) > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Inventory Adjustment Gain</Text>
                <Text style={[styles.value, { color: '#B8F25C' }]}>
                  {formatMoney(metrics?.inventoryAdjustmentGainMinor)}
                </Text>
              </View>
            )}

            <View style={[styles.row, styles.borderTop, styles.marginTop, { paddingTop: 16 }]}>
              <Text style={[styles.boldLabel, { fontSize: 18, color: '#B8F25C' }]}>
                Net Profit / (Loss)
              </Text>
              <Text style={[styles.boldValue, { fontSize: 18, color: '#B8F25C' }]}>
                {formatMoney(metrics?.operatingResultMinor)}
              </Text>
            </View>
          </View>
        </ScrollView>
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

  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },

  heroResultCard: {
    backgroundColor: '#0E291E',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
    marginBottom: 16,
  },
  heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 4 },
  heroAmount: { fontSize: 32, fontWeight: '900', color: '#B8F25C', marginVertical: 4 },
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  value: { fontSize: 14, color: '#FFF', fontWeight: '600' },
  boldLabel: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  boldValue: { fontSize: 15, fontWeight: '900', color: '#FFF' },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 12,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 6,
  },
  marginTop: { marginTop: 10 },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
});
