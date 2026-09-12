import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { MoneyText } from '../../../components/MoneyText';
import { Badge } from '../../../components/Badge';
import { recordSalePaymentSchema } from '@nnoo/validation';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { activeBusiness } = useBusiness();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [issuing, setIssuing] = useState(false);

  // Void Modal State
  const [voidModalVisible, setVoidModalVisible] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [submittingVoid, setSubmittingVoid] = useState(false);

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos' | 'bank_transfer'>('cash');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const currencyCode = (activeBusiness as any)?.currency_code || 'NGN';

  const fetchInvoiceDetails = async () => {
    if (!activeBusiness || !id) return;
    try {
      const [invRes, linesRes] = await Promise.all([
        supabase
          .from('invoices')
          .select(`
            *,
            customers (id, name, phone, email, address_line_1, city, state),
            sales (id, payment_status, total_minor, occurred_at)
          `)
          .eq('id', id)
          .eq('business_id', activeBusiness.id)
          .single(),
        supabase
          .from('invoice_lines')
          .select('*')
          .eq('invoice_id', id)
          .order('line_order', { ascending: true }),
      ]);

      if (invRes.error) throw invRes.error;

      setInvoice(invRes.data);
      setLines(linesRes.data || []);

      if (invRes.data?.sale_id) {
        const { data: payData } = await supabase
          .from('sale_payments')
          .select('*')
          .eq('sale_id', invRes.data.sale_id)
          .order('occurred_at', { ascending: true });
        setPayments(payData || []);
      }
    } catch (err: any) {
      console.error('Error fetching invoice details:', err);
      Alert.alert('Error', err.message || 'Failed to load invoice details.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInvoiceDetails();
    }, [id, activeBusiness])
  );

  const handleIssueInvoice = async () => {
    if (!invoice) return;
    setIssuing(true);

    try {
      const issuePayload = {
        invoice_id: invoice.id,
        business_id: activeBusiness!.id,
        currency_code: invoice.currency_code,
        effective_date: new Date().toISOString().split('T')[0],
        items: lines.map((l) => ({
          catalogItemId: l.catalog_item_id,
          quantity: l.quantity,
          discountMinor: l.discount_minor || '0',
        })),
        idempotency_key: Crypto.randomUUID(),
      };

      const { error } = await supabase.rpc('issue_invoice', {
        payload: issuePayload,
      });

      if (error) throw error;

      Alert.alert('Success', 'Invoice issued successfully!');
      fetchInvoiceDetails();
    } catch (err: any) {
      console.error('Error issuing invoice:', err);
      Alert.alert('Action Failed', err.message || 'Could not issue invoice.');
    } finally {
      setIssuing(false);
    }
  };

  const handleVoidInvoice = async () => {
    if (!voidReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for voiding this invoice.');
      return;
    }

    setSubmittingVoid(true);
    try {
      const { error } = await supabase.rpc('void_invoice', {
        p_invoice_id: invoice.id,
        p_reason: voidReason.trim(),
      });

      if (error) throw error;

      setVoidModalVisible(false);
      setVoidReason('');
      Alert.alert('Success', 'Invoice voided successfully.');
      fetchInvoiceDetails();
    } catch (err: any) {
      console.error('Error voiding invoice:', err);
      Alert.alert('Void Failed', err.message || 'Could not void invoice.');
    } finally {
      setSubmittingVoid(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice?.id) return;
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://nnoo.app';
      const pdfUrl = `${baseUrl}/api/v1/invoices/${invoice.id}/pdf`;
      await Linking.openURL(pdfUrl);
    } catch (err: any) {
      Alert.alert('PDF Export', err.message || 'Unable to open Invoice PDF.');
    }
  };

  const totalMinor = parseInt(invoice?.total_minor || '0', 10);
  const totalPaidMinor = payments.reduce(
    (sum, p) => sum + (parseInt(p.amount_minor, 10) || 0),
    0
  );
  const balanceDueMinor = Math.max(0, totalMinor - totalPaidMinor);

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive payment amount.');
      return;
    }

    const amountMinor = Math.round(parseFloat(paymentAmount) * 100);
    if (amountMinor > balanceDueMinor) {
      Alert.alert(
        'Amount Exceeded',
        `Payment cannot exceed the balance due of ${currencyCode} ${(balanceDueMinor / 100).toFixed(2)}`
      );
      return;
    }

    setSubmittingPayment(true);

    try {
      const draft = {
        saleId: invoice.sale_id,
        amountMinor: amountMinor.toString(),
        paymentMethod: paymentMethod,
        effectiveDate: new Date().toISOString().split('T')[0],
        idempotencyKey: Crypto.randomUUID(),
      };

      const parseResult = recordSalePaymentSchema.safeParse(draft);
      if (!parseResult.success) {
        Alert.alert('Validation Error', parseResult.error.errors[0]?.message || 'Invalid payment');
        setSubmittingPayment(false);
        return;
      }

      const payload = {
        businessId: activeBusiness!.id,
        ...parseResult.data,
      };

      const { error } = await supabase.rpc('record_sale_payment', {
        payload,
      });

      if (error) throw error;

      setPaymentModalVisible(false);
      setPaymentAmount('');
      Alert.alert('Success', 'Payment recorded successfully!');
      fetchInvoiceDetails();
    } catch (err: any) {
      console.error('Error recording payment:', err);
      Alert.alert('Payment Failed', err.message || 'Failed to record payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleShareInvoice = async () => {
    if (!invoice) return;
    try {
      const shareMessage =
        `OFFICIAL INVOICE\n` +
        `Invoice #: ${invoice.invoice_number || 'DRAFT'}\n` +
        `Business: ${activeBusiness?.name}\n` +
        `Customer: ${invoice.customers?.name}\n` +
        `Total Amount: ${currencyCode} ${(invoice.total_minor / 100).toFixed(2)}\n` +
        `Payment Due Date: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Due on receipt'}\n` +
        (invoice.notes ? `Payment Instructions: ${invoice.notes}\n` : '') +
        `\nThank you for choosing ${activeBusiness?.name}!`;

      await Share.share({
        message: shareMessage,
        title: `Invoice ${invoice.invoice_number || ''}`,
      });
    } catch (err: any) {
      console.error('Error sharing invoice:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color="#B8F25C" />
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.errorText}>Invoice not found.</Text>
        <TouchableOpacity style={styles.backBtnAction} onPress={() => router.back()}>
          <Text style={styles.backBtnActionText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isIssued = invoice.document_status === 'issued';
  const isVoided = invoice.document_status === 'voided';
  const isPaid = invoice.sales?.payment_status === 'paid';
  const isOverdue =
    isIssued &&
    !isPaid &&
    invoice.due_date &&
    new Date(invoice.due_date) < new Date();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>
              {invoice.invoice_number || 'Draft Invoice'}
            </Text>
            <Text style={styles.subtext}>
              {invoice.issue_date
                ? `Issued on ${new Date(invoice.issue_date).toLocaleDateString()}`
                : 'Draft document'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShareInvoice}>
          <Feather name="share-2" size={20} color="#B8F25C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status & Amount Hero */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.statusLabel}>Invoice Total</Text>
              <MoneyText amountMinor={invoice.total_minor} style={styles.totalAmountText} />
            </View>
            <Badge
              label={
                isVoided
                  ? 'Voided'
                  : invoice.document_status === 'draft'
                  ? 'Draft'
                  : isPaid
                  ? 'Paid'
                  : isOverdue
                  ? 'Overdue'
                  : 'Unpaid'
              }
              variant={
                isVoided
                  ? 'error'
                  : isPaid
                  ? 'success'
                  : isOverdue
                  ? 'error'
                  : invoice.document_status === 'draft'
                  ? 'default'
                  : 'warning'
              }
            />
          </View>

          {invoice.due_date && (
            <View style={styles.dueDateRow}>
              <Text style={styles.dueDateLabel}>Payment Due Date:</Text>
              <Text style={[styles.dueDateValue, isOverdue && { color: '#FF4D4D' }]}>
                {new Date(invoice.due_date).toLocaleDateString()}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          {invoice.document_status === 'draft' && (
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={handleIssueInvoice}
              disabled={issuing}
              activeOpacity={0.8}
            >
              {issuing ? (
                <ActivityIndicator color="#0A1C16" />
              ) : (
                <>
                  <Feather name="check-circle" size={18} color="#0A1C16" />
                  <Text style={styles.primaryActionBtnText}>Issue Official Invoice</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {isIssued && !isPaid && !isVoided && invoice.sale_id && (
            <View style={styles.dualActionsRow}>
              <TouchableOpacity
                style={styles.recordPaymentBtn}
                onPress={() => {
                  setPaymentAmount((balanceDueMinor / 100).toFixed(2));
                  setPaymentModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Feather name="credit-card" size={18} color="#0A1C16" />
                <Text style={styles.recordPaymentBtnText}>Record Payment</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.voidBtn}
                onPress={() => setVoidModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.voidBtnText}>Void</Text>
              </TouchableOpacity>
            </View>
          )}

          {isIssued && (
            <TouchableOpacity
              style={styles.pdfActionBtn}
              onPress={handleDownloadPdf}
              activeOpacity={0.8}
            >
              <Feather name="file-text" size={16} color="#FFFFFF" />
              <Text style={styles.pdfActionBtnText}>View / Export PDF</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Billed Customer Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Billed To</Text>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Feather name="user" size={18} color="#B8F25C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>
                {invoice.customers?.name || 'Walk-in Client'}
              </Text>
              <Text style={styles.customerContact}>
                {invoice.customers?.email || invoice.customers?.phone || 'No direct contact account'}
              </Text>
              {invoice.customers?.city ? (
                <Text style={styles.customerAddress}>
                  {invoice.customers.address_line_1 ? `${invoice.customers.address_line_1}, ` : ''}
                  {invoice.customers.city}, {invoice.customers.state}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Billed Items Table */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invoice Line Items ({lines.length})</Text>
          {lines.map((line, index) => {
            const unitPrice = parseInt(line.unit_price_minor, 10) || 0;
            const lineTotal = parseInt(line.line_total_minor, 10) || 0;
            const discount = parseInt(line.discount_minor || '0', 10);

            return (
              <View
                key={line.id || index}
                style={[styles.itemRow, index > 0 && styles.itemRowBorder]}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{line.item_name_snapshot}</Text>
                  <Text style={styles.itemMeta}>
                    {parseFloat(line.quantity).toString()} {line.unit_code_snapshot} ×{' '}
                    {currencyCode} {(unitPrice / 100).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemTotal}>
                    {currencyCode} {(lineTotal / 100).toFixed(2)}
                  </Text>
                  {discount > 0 && (
                    <Text style={styles.itemDiscount}>
                      -{currencyCode} {(discount / 100).toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Payment Receipts History */}
        {payments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payments Applied ({payments.length})</Text>
            {payments.map((p, index) => {
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
                    +{currencyCode} {(amount / 100).toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Notes & Terms */}
        {invoice.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Instructions & Remarks</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Void Modal */}
      <Modal visible={voidModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Void Invoice</Text>
              <TouchableOpacity onPress={() => setVoidModalVisible(false)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.voidWarningText}>
              Voiding this invoice will cancel the receivable balance and reverse all linked stock/accounting entries.
            </Text>

            <Text style={styles.inputLabel}>Reason for Voiding *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Order cancelled by customer..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={voidReason}
              onChangeText={setVoidReason}
            />

            <TouchableOpacity
              style={[styles.voidSubmitBtn, submittingVoid && styles.submitButtonDisabled]}
              onPress={handleVoidInvoice}
              disabled={submittingVoid}
            >
              {submittingVoid ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.voidSubmitBtnText}>Confirm Void Invoice</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Record Payment Modal */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Customer Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Balance Due: {currencyCode} {(balanceDueMinor / 100).toFixed(2)}
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

            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.methodToggleRow}>
              {[
                { key: 'cash', label: 'Cash' },
                { key: 'bank_transfer', label: 'Transfer' },
                { key: 'pos', label: 'POS' },
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
              style={[styles.primaryActionBtn, submittingPayment && styles.submitButtonDisabled]}
              onPress={handleRecordPayment}
              disabled={submittingPayment}
            >
              {submittingPayment ? (
                <ActivityIndicator color="#0A1C16" />
              ) : (
                <Text style={styles.primaryActionBtnText}>Confirm Payment & Issue Receipt</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 14, padding: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  shareBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

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

  dueDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  dueDateLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  dueDateValue: { fontSize: 15, fontWeight: '800', color: '#FFF' },

  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B8F25C',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  primaryActionBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 15 },

  dualActionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  recordPaymentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B8F25C',
    borderRadius: 14,
    paddingVertical: 14,
  },
  recordPaymentBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 15 },
  voidBtn: {
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voidBtnText: { color: '#FF4D4D', fontWeight: '800', fontSize: 14 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 14 },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  customerContact: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  customerAddress: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

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
  itemRight: { alignItems: 'flex-end' },
  itemTotal: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  itemDiscount: { fontSize: 11, color: '#B8F25C', marginTop: 2 },

  paymentHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paymentMethodText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  paymentDateText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  paymentAmountText: { fontSize: 15, fontWeight: '800', color: '#B8F25C' },

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
  voidWarningText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
    lineHeight: 18,
  },
  inputLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 8 },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  methodToggleRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
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

  voidSubmitBtn: {
    backgroundColor: '#FF4D4D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  voidSubmitBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  submitButtonDisabled: { opacity: 0.5 },
  pdfActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  pdfActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
