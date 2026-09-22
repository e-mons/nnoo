import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Badge } from '../../../../components/Badge';
import { MoneyText } from '../../../../components/MoneyText';

export default function SupplierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activeBusiness } = useBusiness();

  const [supplier, setSupplier] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stockReceipts, setStockReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSupplierDetails = async () => {
    if (!activeBusiness || !id) return;
    try {
      const [supplierRes, expRes, receiptRes] = await Promise.all([
        supabase
          .from('suppliers')
          .select('*')
          .eq('id', id)
          .eq('business_id', activeBusiness.id)
          .single(),
        supabase
          .from('expenses')
          .select('*')
          .eq('supplier_id', id)
          .eq('business_id', activeBusiness.id)
          .neq('status', 'reversed')
          .order('effective_date', { ascending: false })
          .limit(10),
        supabase
          .from('stock_receipts')
          .select('*')
          .eq('supplier_id', id)
          .eq('business_id', activeBusiness.id)
          .order('received_at', { ascending: false })
          .limit(10),
      ]);

      if (supplierRes.error) throw supplierRes.error;

      setSupplier(supplierRes.data);
      setExpenses(expRes.data || []);
      setStockReceipts(receiptRes.data || []);
    } catch (err: any) {
      console.error('Error fetching supplier details', err);
      Alert.alert('Error', 'Failed to load supplier details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSupplierDetails();
    }, [id, activeBusiness])
  );

  const handleCall = () => {
    if (supplier?.phone) {
      Linking.openURL(`tel:${supplier.phone}`);
    }
  };

  const handleEmail = () => {
    if (supplier?.email) {
      Linking.openURL(`mailto:${supplier.email}`);
    }
  };

  const handleShare = async () => {
    if (!supplier) return;
    try {
      await Share.share({
        message: `Vendor: ${supplier.name}\nCompany: ${supplier.company_name || 'N/A'}\nPhone: ${supplier.phone || 'N/A'}\nEmail: ${supplier.email || 'N/A'}`,
        title: supplier.name,
      });
    } catch (err) {
      console.error('Error sharing supplier:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color="#B8F25C" />
      </SafeAreaView>
    );
  }

  if (!supplier) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.errorText}>Supplier not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const unpaidExpenses = expenses.filter((e) => e.payment_status !== 'paid');
  const totalPayableMinor = unpaidExpenses.reduce(
    (sum, e) => sum + (parseInt(e.total_minor, 10) || 0),
    0
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
            <Feather name="share-2" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/(app)/more/suppliers/${supplier.id}/edit` as any)}
            style={[styles.iconButton, { marginLeft: 8 }]}
          >
            <Ionicons name="pencil" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Section */}
        <View style={styles.topSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(supplier.name?.[0] || 'S').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{supplier.name}</Text>
          {supplier.company_name && (
            <Text style={styles.companyName}>{supplier.company_name}</Text>
          )}
          <View style={styles.badges}>
            <Badge
              label={supplier.status}
              variant={supplier.status === 'active' ? 'success' : 'default'}
            />
            <Badge
              label={supplier.supplier_type === 'business' ? 'Vendor' : 'Contractor'}
              variant="info"
            />
          </View>
        </View>

        {/* Contact Action Bar */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, !supplier.phone && styles.actionBtnDisabled]}
            onPress={handleCall}
            disabled={!supplier.phone}
          >
            <Feather name="phone" size={18} color={supplier.phone ? '#B8F25C' : 'rgba(255,255,255,0.2)'} />
            <Text style={[styles.actionBtnText, !supplier.phone && styles.actionBtnTextDisabled]}>
              Call
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, !supplier.email && styles.actionBtnDisabled]}
            onPress={handleEmail}
            disabled={!supplier.email}
          >
            <Feather name="mail" size={18} color={supplier.email ? '#B8F25C' : 'rgba(255,255,255,0.2)'} />
            <Text style={[styles.actionBtnText, !supplier.email && styles.actionBtnTextDisabled]}>
              Email
            </Text>
          </TouchableOpacity>
        </View>

        {/* Outstanding Payables Banner */}
        {totalPayableMinor > 0 && (
          <View style={styles.payableCard}>
            <View>
              <Text style={styles.payableCardLabel}>Outstanding Payables Due</Text>
              <MoneyText amountMinor={totalPayableMinor} style={styles.payableCardAmount} />
            </View>
            <TouchableOpacity
              style={styles.payablesLinkBtn}
              onPress={() => router.push('/(app)/more/reports/payables' as any)}
            >
              <Text style={styles.payablesLinkText}>View Bills</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contact Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact & Location</Text>
          {supplier.contact_person && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact Person</Text>
              <Text style={styles.infoValue}>{supplier.contact_person}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{supplier.phone || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{supplier.email || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={[styles.infoValue, { flex: 1, textAlign: 'right', marginLeft: 12 }]}>
              {[supplier.address_line_1, supplier.city, supplier.state].filter(Boolean).join(', ') ||
                'Not provided'}
            </Text>
          </View>
        </View>

        {/* Recent Stock Receipts */}
        {stockReceipts.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Stock Receipts ({stockReceipts.length})</Text>
            {stockReceipts.map((r, idx) => (
              <TouchableOpacity
                key={r.id || idx}
                style={[styles.historyRow, idx > 0 && styles.historyRowBorder]}
                onPress={() => router.push(`/(app)/inventory/receipts/${r.id}` as any)}
              >
                <View>
                  <Text style={styles.historyNumber}>{r.receipt_number}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(r.received_at || r.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <MoneyText amountMinor={r.total_cost_minor || 0} style={styles.historyAmount} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Expenses */}
        {expenses.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Expense Vouchers ({expenses.length})</Text>
            {expenses.map((e, idx) => (
              <TouchableOpacity
                key={e.id || idx}
                style={[styles.historyRow, idx > 0 && styles.historyRowBorder]}
                onPress={() => router.push(`/(app)/more/expenses/${e.id}` as any)}
              >
                <View>
                  <Text style={styles.historyNumber}>{e.expense_number}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(e.effective_date).toLocaleDateString()} • {e.description}
                  </Text>
                </View>
                <MoneyText amountMinor={e.total_minor} style={styles.historyAmount} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Notes Card */}
        {supplier.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Internal Notes</Text>
            <Text style={styles.notesText}>{supplier.notes}</Text>
          </View>
        ) : null}

        {/* Quick Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.actionLinkBtn}
            onPress={() => router.push('/(app)/inventory/receipts/new' as any)}
          >
            <Feather name="package" size={16} color="#0A1C16" />
            <Text style={styles.actionLinkBtnText}>Receive Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionLinkBtn, styles.actionLinkBtnAlt]}
            onPress={() => router.push('/(app)/more/expenses/new' as any)}
          >
            <Feather name="plus-circle" size={16} color="#FFF" />
            <Text style={[styles.actionLinkBtnText, { color: '#FFF' }]}>Record Expense</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },
  topSection: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.3)',
  },
  avatarText: { color: '#B8F25C', fontSize: 26, fontWeight: '900' },
  name: { fontSize: 24, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  companyName: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 2, marginBottom: 8 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 4 },

  actionGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  actionBtnTextDisabled: { color: 'rgba(255,255,255,0.3)' },

  payableCard: {
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  payableCardLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  payableCardAmount: { fontSize: 20, fontWeight: '900', color: '#FF9800', marginTop: 2 },
  payablesLinkBtn: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  payablesLinkText: { color: '#FF9800', fontWeight: '800', fontSize: 11 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#FFF', marginBottom: 10 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  infoValue: { fontSize: 13, color: '#FFF', fontWeight: '600' },
  notesText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },

  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  historyNumber: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  historyDate: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  historyAmount: { fontSize: 13, fontWeight: '900', color: '#B8F25C' },

  bottomActions: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 30 },
  actionLinkBtn: {
    flex: 1,
    backgroundColor: '#B8F25C',
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionLinkBtnAlt: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  actionLinkBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 13 },

  errorText: { color: '#FFF', fontSize: 16, marginBottom: 16 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  backBtnText: { color: '#FFF', fontWeight: 'bold' },
});
