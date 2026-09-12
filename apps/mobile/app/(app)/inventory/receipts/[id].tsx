import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { MoneyText } from '../../../../components/MoneyText';
import { Badge } from '../../../../components/Badge';
import { recordStockReceiptPaymentSchema } from '@nnoo/validation';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';

export default function StockReceiptDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { activeBusiness } = useBusiness();

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos' | 'bank_transfer'>('cash');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const currencyCode = (activeBusiness as any)?.currency_code || 'NGN';

  const fetchReceiptDetails = async () => {
    if (!activeBusiness || !id) return;
    try {
      setLoading(true);

      const [recRes, itemsRes, paymentsRes] = await Promise.all([
        supabase
          .from('stock_receipts')
          .select('*, suppliers (id, name, phone, email)')
          .eq('id', id)
          .eq('business_id', activeBusiness.id)
          .single(),
        supabase
          .from('stock_receipt_items')
          .select('*, catalog_items (name, sku, unit_code)')
          .eq('stock_receipt_id', id)
          .order('line_order', { ascending: true }),
        supabase
          .from('stock_receipt_payments')
          .select('*')
          .eq('stock_receipt_id', id)
          .order('occurred_at', { ascending: true }),
      ]);

      if (recRes.error) throw recRes.error;

      setReceipt(recRes.data);
      setItems(itemsRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (err: any) {
      console.error('Error fetching stock receipt details:', err);
      Alert.alert('Error', err.message || 'Failed to load stock receipt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceiptDetails();
  }, [id, activeBusiness]);

  const totalMinor = parseInt(receipt?.total_minor || '0', 10);
  const totalPaidMinor = payments.reduce(
    (sum, p) => sum + (parseInt(p.amount_minor, 10) || 0),
    0
  );
  const balanceDueMinor = Math.max(0, totalMinor - totalPaidMinor);

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a positive payment amount.');
      return;
    }

    const amountMinor = Math.round(parseFloat(paymentAmount) * 100);
    if (amountMinor > balanceDueMinor) {
      Alert.alert(
        'Amount Exceeded',
        `Payment cannot exceed the outstanding balance of ${currencyCode} ${(balanceDueMinor / 100).toFixed(2)}`
      );
      return;
    }

    setSubmittingPayment(true);

    try {
      const draft = {
        stockReceiptId: id as string,
        amountMinor: amountMinor.toString(),
        paymentMethod: paymentMethod,
        effectiveDate: new Date().toISOString().split('T')[0],
        idempotencyKey: Crypto.randomUUID(),
      };

      const parseResult = recordStockReceiptPaymentSchema.safeParse(draft);
      if (!parseResult.success) {
        Alert.alert('Validation Error', parseResult.error.errors[0]?.message || 'Invalid payment');
        setSubmittingPayment(false);
        return;
      }

      const payload = {
        businessId: activeBusiness!.id,
        ...parseResult.data,
      };

      const { error } = await supabase.rpc('record_stock_receipt_payment', {
        payload,
      });

      if (error) throw error;

      setPaymentModalVisible(false);
      setPaymentAmount('');
      Alert.alert('Success', 'Supplier payment recorded successfully!');
      fetchReceiptDetails();
    } catch (err: any) {
      console.error('Error recording stock receipt payment:', err);
      Alert.alert('Payment Failed', err.message || 'Failed to record supplier payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color="#B8F25C" />
      </SafeAreaView>
    );
  }

  if (!receipt) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.errorText}>Stock receipt not found.</Text>
        <TouchableOpacity style={styles.backBtnAction} onPress={() => router.back()}>
          <Text style={styles.backBtnActionText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isPaid = receipt.payment_status === 'paid';
  const isPartial = receipt.payment_status === 'partially_paid';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{receipt.receipt_number}</Text>
          <Text style={styles.subtext}>
            Received on {new Date(receipt.effective_date || receipt.occurred_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.statusLabel}>Total Shipment Cost</Text>
              <MoneyText amountMinor={totalMinor} style={styles.totalAmountText} />
            </View>
            <Badge
              label={isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid (AP)'}
              variant={isPaid ? 'success' : isPartial ? 'warning' : 'error'}
            />
          </View>

          {balanceDueMinor > 0 && (
            <View style={styles.balanceRow}>
              <Text style={styles.balanceDueLabel}>Outstanding Payable:</Text>
              <MoneyText
                amountMinor={balanceDueMinor}
                style={[styles.balanceDueText, { color: '#FF9800' }]}
              />
            </View>
          )}

          {balanceDueMinor > 0 && (
            <TouchableOpacity
              style={styles.recordPaymentBtn}
              onPress={() => {
                setPaymentAmount((balanceDueMinor / 100).toFixed(2));
                setPaymentModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Feather name="credit-card" size={18} color="#0A1C16" />
              <Text style={styles.recordPaymentBtnText}>Pay Supplier</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Supplier Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Supplier Details</Text>
          <View style={styles.supplierRow}>
            <View style={styles.supplierAvatar}>
              <Feather name="truck" size={18} color="#B8F25C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.supplierName}>
                {receipt.suppliers?.name || 'Walk-up Supplier'}
              </Text>
              <Text style={styles.supplierContact}>
                {receipt.suppliers?.phone || receipt.suppliers?.email || 'No contact email'}
              </Text>
              {receipt.supplier_reference ? (
                <Text style={styles.supplierRef}>
                  Reference / Waybill: {receipt.supplier_reference}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Received Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Received Items ({items.length})</Text>
          {items.map((item, index) => {
            const unitCost = parseInt(item.unit_cost_minor, 10) || 0;
            const lineTotal = parseInt(item.line_total_minor, 10) || 0;

            return (
              <View
                key={item.id || index}
                style={[styles.itemRow, index > 0 && styles.itemRowBorder]}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>
                    {item.catalog_items?.name || item.item_name_snapshot || 'Item'}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {parseFloat(item.quantity).toString()} {item.unit_code_snapshot || 'units'} ×{' '}
                    {currencyCode} {(unitCost / 100).toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  {currencyCode} {(lineTotal / 100).toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Payment History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Disbursements ({payments.length})</Text>
          {payments.length === 0 ? (
            <Text style={styles.emptyPaymentText}>No payments made yet (Accounts Payable open).</Text>
          ) : (
            payments.map((p, index) => {
              const amount = parseInt(p.amount_minor, 10) || 0;
              return (
                <View
                  key={p.id || index}
                  style={[styles.paymentHistoryRow, index > 0 && styles.itemRowBorder]}
                >
                  <View>
                    <Text style={styles.paymentMethodText}>
                      {p.payment_method?.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.paymentDateText}>
                      {new Date(p.occurred_at || p.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.paymentAmountText}>
                    -{currencyCode} {(amount / 100).toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Notes */}
        {receipt.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{receipt.notes}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Record Payment Modal */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Supplier Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Outstanding Balance: {currencyCode} {(balanceDueMinor / 100).toFixed(2)}
            </Text>

            <Text style={styles.inputLabel}>Payment Amount ({currencyCode})</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <Text style={styles.inputLabel}>Disbursement Method</Text>
            <View style={styles.methodToggleRow}>
              {[
                { key: 'cash', label: 'Cash' },
                { key: 'bank_transfer', label: 'Transfer' },
                { key: 'pos', label: 'POS / Card' },
              ].map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.methodToggleBtn,
                    paymentMethod === m.key && styles.methodToggleBtnActive,
                  ]}
                  onPress={() => setPaymentMethod(m.key as any)}
                >
                  <Text
                    style={[
                      styles.methodToggleText,
                      paymentMethod === m.key && styles.methodToggleTextActive,
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, submittingPayment && styles.modalSubmitBtnDisabled]}
              onPress={handleRecordPayment}
              disabled={submittingPayment}
            >
              {submittingPayment ? (
                <ActivityIndicator color="#0A1C16" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Confirm Disbursement</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 4,
  },
  backButton: { marginRight: 14, padding: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  statusCard: {
    backgroundColor: '#0E291E',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 4 },
  totalAmountText: { fontSize: 28, fontWeight: '900', color: '#B8F25C' },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  balanceDueLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  balanceDueText: { fontSize: 16, fontWeight: '800' },

  recordPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B8F25C',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  recordPaymentBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 14 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 14 },

  supplierRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supplierAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierName: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  supplierContact: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  supplierRef: { fontSize: 12, color: '#B8F25C', marginTop: 4, fontWeight: '600' },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  itemMeta: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  emptyPaymentText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  paymentHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paymentMethodText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  paymentDateText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  paymentAmountText: { fontSize: 15, fontWeight: '800', color: '#FF4D4D' },

  notesText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22 },

  errorText: { color: '#FFF', fontSize: 16, marginBottom: 16 },
  backBtnAction: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backBtnActionText: { color: '#FFF', fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#0A1C16',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  modalSubtitle: { fontSize: 14, color: '#B8F25C', fontWeight: '700', marginBottom: 18 },
  inputLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 8 },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  methodToggleRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  methodToggleBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  methodToggleBtnActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  methodToggleText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  methodToggleTextActive: { color: '#0A1C16' },

  modalSubmitBtn: {
    backgroundColor: '#B8F25C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSubmitBtnDisabled: { opacity: 0.5 },
  modalSubmitBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 15 },
});
