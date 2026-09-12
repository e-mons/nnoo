import React, { useState, useCallback } from 'react';
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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Badge } from '../../../../components/Badge';
import { MoneyText } from '../../../../components/MoneyText';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const [expense, setExpense] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Recording Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'pos'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Reversal Modal State
  const [showReversalModal, setShowReversalModal] = useState(false);
  const [reversalReason, setReversalReason] = useState('');
  const [reversingExpense, setReversingExpense] = useState(false);

  const fetchExpense = async () => {
    if (!activeBusiness || !id) return;
    try {
      const [expenseRes, paymentsRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('*, expense_categories(name), suppliers(name)')
          .eq('id', id)
          .eq('business_id', activeBusiness.id)
          .single(),
        supabase
          .from('expense_payments')
          .select('*')
          .eq('expense_id', id)
          .order('occurred_at', { ascending: false }),
      ]);

      if (expenseRes.error) throw expenseRes.error;

      setExpense(expenseRes.data);
      setPayments(paymentsRes.data || []);
    } catch (err: any) {
      console.error('Error fetching expense details', err);
      Alert.alert('Error', 'Failed to load expense details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExpense();
    }, [id, activeBusiness])
  );

  const handleRecordPayment = async () => {
    if (!activeBusiness || !expense || !paymentAmount) return;

    const amountMinor = Math.round(parseFloat(paymentAmount) * 100);
    if (isNaN(amountMinor) || amountMinor <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    setRecordingPayment(true);
    try {
      const payload = {
        businessId: activeBusiness.id,
        expenseId: expense.id,
        amountMinor,
        paymentMethod,
        reference: paymentReference || undefined,
        effectiveDate: new Date().toISOString().split('T')[0],
        idempotencyKey: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };

      const { error } = await supabase.rpc('record_expense_payment', {
        payload,
      });

      if (error) throw error;

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentReference('');
      Alert.alert('Payment Recorded', 'The expense payment has been processed successfully.');
      fetchExpense();
    } catch (err: any) {
      console.error('Error recording payment:', err);
      Alert.alert('Payment Error', err.message || 'Failed to record expense payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleReverseExpense = async () => {
    if (!activeBusiness || !expense || !reversalReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a valid reason for reversing this expense.');
      return;
    }

    setReversingExpense(true);
    try {
      const payload = {
        businessId: activeBusiness.id,
        expenseId: expense.id,
        reason: reversalReason.trim(),
        idempotencyKey: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };

      const { error } = await supabase.rpc('reverse_expense', {
        payload,
      });

      if (error) throw error;

      setShowReversalModal(false);
      setReversalReason('');
      Alert.alert('Expense Reversed', 'The expense and its accounting entries have been reversed.');
      fetchExpense();
    } catch (err: any) {
      console.error('Error reversing expense:', err);
      Alert.alert('Reversal Error', err.message || 'Failed to reverse expense');
    } finally {
      setReversingExpense(false);
    }
  };

  const handleShare = async () => {
    if (!expense) return;
    try {
      const formattedTotal = (parseInt(expense.total_minor, 10) / 100).toFixed(2);
      await Share.share({
        message: `Expense Voucher: ${expense.expense_number}\nCategory: ${expense.expense_categories?.name || 'General'}\nSupplier: ${expense.suppliers?.name || 'None'}\nAmount: ${(activeBusiness as any)?.currency_code || 'NGN'} ${formattedTotal}\nStatus: ${expense.status === 'reversed' ? 'REVERSED' : expense.payment_status?.toUpperCase()}\nDescription: ${expense.description}`,
        title: `Expense ${expense.expense_number}`,
      });
    } catch (err) {
      console.error('Error sharing expense:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color="#B8F25C" />
      </SafeAreaView>
    );
  }

  if (!expense) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.errorText}>Expense not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const total = Number(expense.total_minor);
  const paid = payments.reduce((sum, p) => sum + Number(p.amount_minor), 0);
  const balance = total - paid;
  const isReversed = expense.status === 'reversed';

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
          {!isReversed && (
            <TouchableOpacity
              onPress={() => setShowReversalModal(true)}
              style={[styles.iconButton, { marginLeft: 8 }]}
            >
              <Feather name="rotate-ccw" size={18} color="#FF4D4D" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Section */}
        <View style={styles.topSection}>
          <Text style={styles.title}>Expense Voucher</Text>
          <Text style={styles.expenseNum}>{expense.expense_number}</Text>
          <MoneyText amountMinor={expense.total_minor} style={styles.totalPrice} />
          <View style={styles.badges}>
            <Badge
              label={isReversed ? 'REVERSED' : expense.payment_status?.toUpperCase()}
              variant={
                isReversed
                  ? 'error'
                  : expense.payment_status === 'paid'
                  ? 'success'
                  : 'warning'
              }
            />
            <Badge
              label={expense.expense_categories?.name || 'General Expense'}
              variant="default"
            />
          </View>
        </View>

        {/* Balance Due Action Card */}
        {!isReversed && balance > 0 && (
          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.balanceCardLabel}>Outstanding Payable Due</Text>
              <MoneyText amountMinor={balance} style={styles.balanceCardAmount} />
            </View>
            <TouchableOpacity
              style={styles.payActionBtn}
              onPress={() => {
                setPaymentAmount((balance / 100).toFixed(2));
                setShowPaymentModal(true);
              }}
              activeOpacity={0.8}
            >
              <Feather name="check" size={16} color="#0A1C16" />
              <Text style={styles.payActionBtnText}>Disburse</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Voucher Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Effective Date</Text>
            <Text style={styles.infoValue}>
              {new Date(expense.effective_date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Supplier / Payee</Text>
            <Text style={styles.infoValue}>{expense.suppliers?.name || 'Walk-up / None'}</Text>
          </View>
          {expense.external_reference && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invoice Reference</Text>
              <Text style={styles.infoValue}>{expense.external_reference}</Text>
            </View>
          )}
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 10 }]}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={[styles.infoValue, { flex: 1, textAlign: 'right', marginLeft: 12 }]}>
              {expense.description}
            </Text>
          </View>
        </View>

        {/* Payments History */}
        {payments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Disbursement History ({payments.length})</Text>
            {payments.map((p, idx) => (
              <View
                key={p.id || idx}
                style={[styles.paymentRow, idx > 0 && styles.paymentRowBorder]}
              >
                <View>
                  <Text style={styles.paymentMethod}>
                    {p.payment_method?.toUpperCase()}
                  </Text>
                  <Text style={styles.paymentDate}>
                    {new Date(p.occurred_at || p.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <MoneyText amountMinor={p.amount_minor} style={styles.paymentAmount} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Record Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Expense Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInputLabel}>Disbursement Amount ({(activeBusiness as any)?.currency_code || 'NGN'}) *</Text>
            <View style={styles.modalInputBox}>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={[styles.modalInputLabel, { marginTop: 14 }]}>Payment Channel</Text>
            <View style={styles.methodsRow}>
              {[
                { key: 'cash', label: 'Cash' },
                { key: 'transfer', label: 'Transfer' },
                { key: 'pos', label: 'Card / POS' },
              ].map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.methodChip,
                    paymentMethod === m.key && styles.methodChipActive,
                  ]}
                  onPress={() => setPaymentMethod(m.key as any)}
                >
                  <Text
                    style={[
                      styles.methodChipText,
                      paymentMethod === m.key && styles.methodChipTextActive,
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalInputLabel, { marginTop: 14 }]}>Transaction Reference (Optional)</Text>
            <View style={styles.modalInputBox}>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Bank Transfer Ref / POS Ref"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={paymentReference}
                onChangeText={setPaymentReference}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, recordingPayment && styles.btnDisabled]}
              onPress={handleRecordPayment}
              disabled={recordingPayment}
              activeOpacity={0.8}
            >
              {recordingPayment ? (
                <ActivityIndicator color="#0A1C16" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Confirm Disbursement</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reverse Expense Modal */}
      <Modal visible={showReversalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reverse Expense</Text>
              <TouchableOpacity onPress={() => setShowReversalModal(false)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.reversalNotice}>
              Reversing this expense will cancel the voucher and automatically reverse all associated ledger journal entries.
            </Text>

            <Text style={styles.modalInputLabel}>Reason for Reversal *</Text>
            <View style={[styles.modalInputBox, { height: 80, alignItems: 'flex-start' }]}>
              <TextInput
                style={[styles.modalInput, { paddingTop: 10 }]}
                placeholder="Explain why this expense is being reversed..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={reversalReason}
                onChangeText={setReversalReason}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[styles.reversalSubmitBtn, reversingExpense && styles.btnDisabled]}
              onPress={handleReverseExpense}
              disabled={reversingExpense}
              activeOpacity={0.8}
            >
              {reversingExpense ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.reversalSubmitBtnText}>Confirm Reversal</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  topSection: { marginBottom: 20 },
  title: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  expenseNum: { fontSize: 24, fontWeight: '900', color: '#FFF', marginTop: 2 },
  totalPrice: { fontSize: 32, fontWeight: '900', color: '#B8F25C', marginVertical: 6 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },

  balanceCard: {
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceCardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  balanceCardAmount: { fontSize: 22, fontWeight: '900', color: '#FF9800', marginTop: 2 },
  payActionBtn: {
    backgroundColor: '#B8F25C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  payActionBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 14 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  infoValue: { fontSize: 14, color: '#FFF', fontWeight: '600' },

  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paymentRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  paymentMethod: { fontSize: 13, color: '#FFF', fontWeight: '800' },
  paymentDate: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  paymentAmount: { fontSize: 15, fontWeight: '900', color: '#B8F25C' },

  errorText: { color: '#FFF', fontSize: 16, marginBottom: 16 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  backBtnText: { color: '#FFF', fontWeight: 'bold' },

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
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  modalInputLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginBottom: 6 },
  modalInputBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
  },
  modalInput: { color: '#FFF', fontSize: 15 },

  methodsRow: { flexDirection: 'row', gap: 8 },
  methodChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  methodChipActive: { backgroundColor: 'rgba(184, 242, 92, 0.2)', borderColor: '#B8F25C' },
  methodChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  methodChipTextActive: { color: '#B8F25C' },

  modalSubmitBtn: {
    backgroundColor: '#B8F25C',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  modalSubmitBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 15 },
  btnDisabled: { opacity: 0.5 },

  reversalNotice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
    marginBottom: 16,
  },
  reversalSubmitBtn: {
    backgroundColor: '#FF4D4D',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  reversalSubmitBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
});
