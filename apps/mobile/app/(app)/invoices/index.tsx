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
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { MoneyText } from '../../../components/MoneyText';
import { Badge } from '../../../components/Badge';
import { Feather } from '@expo/vector-icons';

export default function InvoicesIndexScreen() {
  const { activeBusiness } = useBusiness();
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'draft' | 'paid' | 'overdue'>('all');

  const fetchInvoices = async () => {
    if (!activeBusiness) return;
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          document_status,
          total_minor,
          issue_date,
          due_date,
          created_at,
          customers ( id, name ),
          sales ( id, payment_status, total_minor )
        `)
        .eq('business_id', activeBusiness.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setInvoices(data || []);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInvoices();
    }, [activeBusiness])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const num = inv.invoice_number?.toLowerCase() || '';
    const cust = inv.customers?.name?.toLowerCase() || '';
    const q = search.toLowerCase();
    const matchesSearch = num.includes(q) || cust.includes(q);

    const isIssued = inv.document_status === 'issued';
    const isPaid = inv.sales?.payment_status === 'paid';
    const isOverdue =
      isIssued &&
      !isPaid &&
      inv.due_date &&
      new Date(inv.due_date) < new Date();
    const isDraft = inv.document_status === 'draft';
    const isUnpaid = isIssued && !isPaid;

    if (filter === 'unpaid') return matchesSearch && isUnpaid;
    if (filter === 'draft') return matchesSearch && isDraft;
    if (filter === 'paid') return matchesSearch && isPaid;
    if (filter === 'overdue') return matchesSearch && isOverdue;

    return matchesSearch;
  });

  const renderItem = ({ item }: { item: any }) => {
    const isIssued = item.document_status === 'issued';
    const isPaid = item.sales?.payment_status === 'paid';
    const isOverdue =
      isIssued &&
      !isPaid &&
      item.due_date &&
      new Date(item.due_date) < new Date();

    let statusVariant: 'success' | 'warning' | 'error' | 'info' | 'default' = 'default';
    let statusLabel = item.document_status?.toUpperCase() || 'DRAFT';

    if (item.document_status === 'draft') {
      statusVariant = 'default';
      statusLabel = 'Draft';
    } else if (item.document_status === 'voided') {
      statusVariant = 'error';
      statusLabel = 'Voided';
    } else if (isPaid) {
      statusVariant = 'success';
      statusLabel = 'Paid';
    } else if (isOverdue) {
      statusVariant = 'error';
      statusLabel = 'Overdue';
    } else if (isIssued) {
      statusVariant = 'warning';
      statusLabel = 'Unpaid';
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/invoices/${item.id}` as any)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.docNumber}>{item.invoice_number || 'Draft Invoice'}</Text>
          <MoneyText amountMinor={item.total_minor} style={styles.amount} />
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.customerName}>
            {item.customers?.name || 'Walk-in Customer'}
          </Text>
          <Badge label={statusLabel} variant={statusVariant} />
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateText}>
            {item.issue_date ? `Issued: ${new Date(item.issue_date).toLocaleDateString()}` : `Created: ${new Date(item.created_at).toLocaleDateString()}`}
          </Text>
          {item.due_date && (
            <Text style={[styles.dateText, isOverdue && { color: '#FF4D4D' }]}>
              Due: {new Date(item.due_date).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Invoices</Text>
          <Text style={styles.subtext}>Manage customer billing & terms</Text>
        </View>
        <TouchableOpacity
          style={styles.receiptsButton}
          onPress={() => router.push('/(app)/invoices/receipts/' as any)}
          activeOpacity={0.8}
        >
          <Feather name="file-text" size={16} color="#B8F25C" />
          <Text style={styles.receiptsButtonText}>Receipts</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search invoice # or customer..."
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

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'All' },
            { key: 'unpaid', label: 'Unpaid' },
            { key: 'draft', label: 'Drafts' },
            { key: 'overdue', label: 'Overdue' },
            { key: 'paid', label: 'Paid' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                filter === f.key && styles.filterChipActive,
              ]}
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

      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={36} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No invoices found.</Text>
            <Text style={styles.emptySubtext}>Tap the + button to create a new invoice.</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/invoices/new' as any)}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  receiptsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(184, 242, 92, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.3)',
  },
  receiptsButtonText: { color: '#B8F25C', fontWeight: '800', fontSize: 13 },

  searchSection: { paddingHorizontal: 24, marginTop: 12, marginBottom: 4 },
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

  listContent: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 130 },
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
  docNumber: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  amount: { fontSize: 18, fontWeight: '900', color: '#B8F25C' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

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

  emptyContainer: { padding: 48, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '700' },
  emptySubtext: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' },

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
