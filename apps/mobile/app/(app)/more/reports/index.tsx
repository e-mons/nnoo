import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function ReportsIndexScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();

  const reports = [
    {
      title: 'Sales & Revenue',
      path: 'sales',
      desc: 'Sales orders, customer payments, and returns',
      icon: 'trending-up',
      color: '#B8F25C',
    },
    {
      title: 'Profitability (P&L)',
      path: 'profitability',
      desc: 'Statement of profit & loss, COGS, and net margin',
      icon: 'pie-chart',
      color: '#3B82F6',
    },
    {
      title: 'Operating Expenses',
      path: 'expenses',
      desc: 'Operational disbursements and category breakdown',
      icon: 'credit-card',
      color: '#FF4D4D',
    },
    {
      title: 'Accounts Receivable',
      path: 'receivables',
      desc: 'Unpaid customer sales, invoices, and debt aging',
      icon: 'file-text',
      color: '#10B981',
    },
    {
      title: 'Accounts Payable',
      path: 'payables',
      desc: 'Pending supplier vouchers and unsettled bills',
      icon: 'clock',
      color: '#FF9800',
    },
    {
      title: 'Inventory Asset Value',
      path: 'inventory',
      desc: 'Live stock valuation, holding cost, and reorder alerts',
      icon: 'box',
      color: '#8B5CF6',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Financial Reports</Text>
          <Text style={styles.subtext}>Live statements for {activeBusiness?.name}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {reports.map((r, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.card}
              onPress={() => router.push(`/(app)/more/reports/${r.path}` as any)}
              activeOpacity={0.75}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: `${r.color}15` }]}>
                  <Feather name={r.icon as any} size={22} color={r.color} />
                </View>
                <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
              </View>

              <Text style={styles.cardTitle}>{r.title}</Text>
              <Text style={styles.cardDesc}>{r.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: { marginRight: 14, padding: 6 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },
  grid: { gap: 14 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
});
