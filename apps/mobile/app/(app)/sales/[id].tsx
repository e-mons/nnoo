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
  KeyboardAvoidingView,
  Platform,
  Share,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { MoneyText } from '../../../components/MoneyText';
import { Badge } from '../../../components/Badge';
import { recordSalePaymentSchema, createSaleRefundSchema } from '@nnoo/validation';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { activeBusiness } = useBusiness();

  const [loading, setLoading] = useState(true);
  const [sale, setSale] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [refundItems, setRefundItems] = useState<any[]>([]);

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos' | 'bank_transfer'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Refund Modal State
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [refundReason, setRefundReason] = useState<string>('customer_return');
  const [refundQtys, setRefundQtys] = useState<Record<string, string>>({});
  const [restockItems, setRestockItems] = useState<Record<string, boolean>>({});
  const [cashRefundMethod, setCashRefundMethod] = useState<'cash' | 'pos' | 'bank_transfer'>('cash');
  const [cashRefundReference, setCashRefundReference] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const currencyCode = (activeBusiness as any)?.currency_code || 'NGN';

  const formatMoney = (minor: number) => {
    return `${currencyCode} ${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fetchSaleDetails = async () => {
    if (!activeBusiness || !id) return;
    try {
      const [saleRes, itemsRes, paymentsRes, refundsRes, refundItemsRes] = await Promise.all([
        supabase
          .from('sales')
          .select(`
            *,
            customers (
              id,
              name,
              phone,
              email,
              customer_type
            ),
            invoices (
              id,
              invoice_number,
              document_status,
              total_minor,
              due_date
            )
          `)
          .eq('id', id)
          .eq('business_id', activeBusiness.id)
          .single(),
        supabase
          .from('sale_items')
          .select(`
            *,
            catalog_items (
              id,
              name,
              sku,
              unit_code,
              item_type,
              track_inventory
            )
          `)
          .eq('sale_id', id)
          .eq('business_id', activeBusiness.id)
          .order('line_order', { ascending: true }),
        supabase
          .from('sale_payments')
          .select('*')
          .eq('sale_id', id)
          .order('occurred_at', { ascending: true }),
        supabase
          .from('sale_refunds')
          .select(`
            *,
            sale_refund_items (
              id,
              sale_item_id,
              quantity,
              unit_price_minor,
              subtotal_minor,
              discount_minor,
              total_minor,
              restock_inventory,
              item_name_snapshot
            )
          `)
          .eq('sale_id', id)
          .order('occurred_at', { ascending: true }),
        supabase
          .from('sale_refund_items')
          .select('*')
          .eq('business_id', activeBusiness.id),
      ]);

      if (saleRes.error) throw saleRes.error;

      setSale(saleRes.data);
      setItems(itemsRes.data || []);
      setPayments(paymentsRes.data || []);
      setRefunds(refundsRes.data || []);
      setRefundItems(refundItemsRes.data || []);
    } catch (err: any) {
      console.error('Error fetching sale details:', err);
      Alert.alert('Error', err.message || 'Failed to load sale details.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSaleDetails();
    }, [id, activeBusiness])
  );

  const totalMinor = parseInt(sale?.total_minor || '0', 10);
  const totalPaidMinor = payments.reduce(
    (sum, p) => sum + (parseInt(p.amount_minor, 10) || 0),
    0
  );
  const totalCashRefundedMinor = refunds.reduce(
    (sum, r) => sum + (parseInt(r.cash_refund_minor || '0', 10) || 0),
    0
  );
  const totalRefundedMinor = refunds.reduce(
    (sum, r) => sum + (parseInt(r.total_minor || '0', 10) || 0),
    0
  );

  const netSaleMinor = Math.max(0, totalMinor - totalRefundedMinor);
  const netPaidMinor = Math.max(0, totalPaidMinor - totalCashRefundedMinor);
  const balanceDueMinor = Math.max(0, netSaleMinor - netPaidMinor);

  const getRefundableQty = (saleItemId: string) => {
    const item = items.find((i) => i.id === saleItemId);
    if (!item) return 0;
    const previouslyRefunded = refundItems
      .filter((ri) => ri.sale_item_id === saleItemId)
      .reduce((sum, ri) => sum + parseFloat(ri.quantity || '0'), 0);
    return Math.max(0, parseFloat(item.quantity || '0') - previouslyRefunded);
  };

  const hasRefundableItems = items.some((i) => getRefundableQty(i.id) > 0);

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive payment amount.');
      return;
    }

    const amountMinor = Math.round(parseFloat(paymentAmount) * 100);
    if (amountMinor > balanceDueMinor) {
      Alert.alert(
        'Amount Exceeded',
        `Payment cannot exceed the balance due of ${formatMoney(balanceDueMinor)}`
      );
      return;
    }

    setSubmittingPayment(true);

    try {
      const draft = {
        saleId: id as string,
        amountMinor: amountMinor.toString(),
        paymentMethod: paymentMethod,
        effectiveDate: new Date().toISOString().split('T')[0],
        reference: paymentReference.trim() || undefined,
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
      setPaymentReference('');
      Alert.alert('Payment Recorded', 'Payment recorded successfully and receipt updated.');
      fetchSaleDetails();
    } catch (err: any) {
      console.error('Error recording payment:', err);
      Alert.alert('Payment Failed', err.message || 'Failed to record payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleProcessRefund = async () => {
    const refundLines = Object.entries(refundQtys)
      .filter(([_, qty]) => parseFloat(qty) > 0)
      .map(([saleItemId, qty]) => {
        const item = items.find((i) => i.id === saleItemId);
        const unitPrice = parseInt(item?.unit_price_minor || '0', 10);
        const lineRefundAmt = Math.round(parseFloat(qty) * unitPrice);

        return {
          saleItemId,
          quantity: qty,
          refundAmountMinor: lineRefundAmt.toString(),
          restock: restockItems[saleItemId] || false,
        };
      });

    if (refundLines.length === 0) {
      Alert.alert('Items Required', 'Please specify a quantity to refund for at least one item.');
      return;
    }

    setSubmittingRefund(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const draft = {
        saleId: id as string,
        reason: refundReason as any,
        effectiveDate: todayStr,
        items: refundLines,
        cashRefundMethod: netPaidMinor > 0 ? cashRefundMethod : undefined,
        cashRefundReference: cashRefundReference.trim() || undefined,
        idempotencyKey: Crypto.randomUUID(),
      };

      const parseResult = createSaleRefundSchema.safeParse(draft);
      if (!parseResult.success) {
        Alert.alert('Validation Error', parseResult.error.errors[0]?.message || 'Invalid refund');
        setSubmittingRefund(false);
        return;
      }

      const payload = {
        businessId: activeBusiness!.id,
        ...parseResult.data,
      };

      const { error } = await supabase.rpc('create_sale_refund', {
        payload,
      });

      if (error) throw error;

      setRefundModalVisible(false);
      setRefundQtys({});
      setRestockItems({});
      setCashRefundReference('');
      Alert.alert('Refund Processed', 'The refund has been completed and inventory ledger updated.');
      fetchSaleDetails();
    } catch (err: any) {
      console.error('Error processing refund:', err);
      Alert.alert('Refund Failed', err.message || 'Could not process refund.');
    } finally {
      setSubmittingRefund(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!sale?.id) return;
    setGeneratingInvoice(true);
    try {
      const { data: invoiceId, error } = await supabase.rpc('generate_invoice_from_sale', {
        p_sale_id: sale.id,
      });

      if (error) throw error;

      Alert.alert('Invoice Created', 'Official invoice has been generated from this sale.', [
        {
          text: 'View Invoice',
          onPress: () => router.push(`/(app)/invoices/${invoiceId}` as any),
        },
        {
          text: 'Stay on Sale',
          style: 'cancel',
        },
      ]);
      fetchSaleDetails();
    } catch (err: any) {
      console.error('Error generating invoice:', err);
      Alert.alert('Error', err.message || 'Failed to generate invoice.');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleShareReceipt = async () => {
    if (!sale) return;
    try {
      const shareMessage =
        `SALES RECEIPT\n` +
        `Order #: ${sale.sale_number}\n` +
        `Business: ${activeBusiness?.name}\n` +
        `Customer: ${sale.customers?.name || 'Walk-in Customer'}\n` +
        `Total Amount: ${formatMoney(totalMinor)}\n` +
        `Payment Status: ${sale.payment_status?.toUpperCase()}\n` +
        `Date: ${new Date(sale.occurred_at || sale.created_at).toLocaleString()}\n\n` +
        `Thank you for your patronising ${activeBusiness?.name}!`;

      await Share.share({
        message: shareMessage,
        title: `Receipt ${sale.sale_number}`,
      });
    } catch (err: any) {
      console.error('Error sharing receipt:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color="#B8F25C" />
      </SafeAreaView>
    );
  }

  if (!sale) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.errorText}>Sale record not found.</Text>
        <TouchableOpacity style={styles.backBtnAction} onPress={() => router.back()}>
          <Text style={styles.backBtnActionText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const existingInvoice = Array.isArray(sale?.invoices)
    ? sale.invoices.find((i: any) => i.document_status !== 'voided')
    : sale?.invoices?.document_status !== 'voided'
    ? sale?.invoices
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{sale.sale_number}</Text>
            <Text style={styles.subtext}>
              {new Date(sale.occurred_at || sale.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShareReceipt}>
          <Feather name="share-2" size={20} color="#B8F25C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.statusLabel}>Total Amount</Text>
              <MoneyText amountMinor={totalMinor} style={styles.totalAmountText} />
            </View>
            <View style={styles.badgesRow}>
              {sale.refund_status && sale.refund_status !== 'none' && (
                <Badge
                  label={sale.refund_status === 'refunded' ? 'Refunded' : 'Partial Refund'}
                  variant="error"
                />
              )}
              <Badge
                label={sale.payment_status.replace('_', ' ')}
                variant={
                  sale.payment_status === 'paid'
                    ? 'success'
                    : sale.payment_status === 'unpaid'
                    ? 'error'
                    : 'warning'
                }
              />
            </View>
          </View>

          {balanceDueMinor > 0 && (
            <View style={styles.balanceRow}>
              <Text style={styles.balanceDueLabel}>Outstanding Balance Due:</Text>
              <MoneyText
                amountMinor={balanceDueMinor}
                style={[styles.balanceDueText, { color: '#FF9800' }]}
              />
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {balanceDueMinor > 0 && (
              <TouchableOpacity
                style={styles.recordPaymentBtn}
                onPress={() => {
                  setPaymentAmount((balanceDueMinor / 100).toFixed(2));
                  setPaymentModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Feather name="plus-circle" size={18} color="#0A1C16" />
                <Text style={styles.recordPaymentBtnText}>Record Payment</Text>
              </TouchableOpacity>
            )}

            <View style={styles.secondaryActionsRow}>
              {existingInvoice ? (
                <TouchableOpacity
                  style={styles.viewInvoiceBtn}
                  onPress={() => router.push(`/(app)/invoices/${existingInvoice.id}` as any)}
                  activeOpacity={0.8}
                >
                  <Feather name="file-text" size={16} color="#B8F25C" />
                  <Text style={styles.viewInvoiceBtnText}>
                    View {existingInvoice.invoice_number || 'Invoice'}
                  </Text>
                </TouchableOpacity>
              ) : balanceDueMinor > 0 && sale.customer_id ? (
                <TouchableOpacity
                  style={styles.generateInvoiceBtn}
                  onPress={handleGenerateInvoice}
                  disabled={generatingInvoice}
                  activeOpacity={0.8}
                >
                  {generatingInvoice ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Feather name="file-plus" size={16} color="#FFF" />
                      <Text style={styles.generateInvoiceBtnText}>Turn into Invoice</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}

              {hasRefundableItems && sale.refund_status !== 'refunded' && (
                <TouchableOpacity
                  style={styles.refundBtn}
                  onPress={() => setRefundModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Feather name="rotate-ccw" size={16} color="#FF9800" />
                  <Text style={styles.refundBtnText}>Process Refund</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Customer Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <TouchableOpacity
            style={styles.customerRow}
            disabled={!sale.customers?.id}
            onPress={() => {
              if (sale.customers?.id) {
                router.push(`/(app)/more/customers/${sale.customers.id}` as any);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.customerAvatar}>
              <Feather name="user" size={18} color="#B8F25C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{sale.customers?.name || 'Walk-in Customer'}</Text>
              <Text style={styles.customerContact}>
                {sale.customers?.phone || sale.customers?.email || 'No contact details attached'}
              </Text>
            </View>
            {sale.customers?.id && (
              <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.4)" />
            )}
          </TouchableOpacity>
        </View>

        {/* Order Items Table */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Line Items ({items.length})</Text>
          {items.map((item, index) => {
            const unitPrice = parseInt(item.unit_price_minor, 10) || 0;
            const subtotal = parseInt(item.subtotal_minor, 10) || 0;
            const discount = parseInt(item.discount_minor || '0', 10);
            const lineTotal = subtotal - discount;

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
                    {parseFloat(item.quantity).toString()} {item.catalog_items?.unit_code || 'units'} ×{' '}
                    {formatMoney(unitPrice)}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemTotal}>{formatMoney(lineTotal)}</Text>
                  {discount > 0 && (
                    <Text style={styles.itemDiscount}>-{formatMoney(discount)}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Settlement Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Financial Summary</Text>
          <View style={styles.summaryBreakdown}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryVal}>
                {formatMoney(parseInt(sale.subtotal_minor || '0', 10))}
              </Text>
            </View>
            {parseInt(sale.discount_total_minor || '0', 10) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#FF9800' }]}>Discounts</Text>
                <Text style={[styles.summaryVal, { color: '#FF9800' }]}>
                  -{formatMoney(parseInt(sale.discount_total_minor, 10))}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Gross Total</Text>
              <Text style={styles.summaryVal}>{formatMoney(totalMinor)}</Text>
            </View>
            {totalRefundedMinor > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#FF4D4D' }]}>Total Refunded</Text>
                <Text style={[styles.summaryVal, { color: '#FF4D4D' }]}>
                  -{formatMoney(totalRefundedMinor)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryDivider]}>
              <Text style={[styles.summaryLabel, { fontWeight: '800', color: '#FFF' }]}>Net Sale</Text>
              <Text style={[styles.summaryVal, { fontWeight: '900', color: '#B8F25C' }]}>
                {formatMoney(netSaleMinor)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Net Paid</Text>
              <Text style={styles.summaryVal}>{formatMoney(netPaidMinor)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: balanceDueMinor > 0 ? '#FF9800' : 'rgba(255,255,255,0.7)' }]}>
                Balance Due
              </Text>
              <Text style={[styles.summaryVal, { color: balanceDueMinor > 0 ? '#FF9800' : '#FFF', fontWeight: '800' }]}>
                {formatMoney(balanceDueMinor)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment History */}
        {payments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Records ({payments.length})</Text>
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
                      {new Date(p.occurred_at || p.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {p.reference ? ` • Ref: ${p.reference}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.paymentAmountText}>+{formatMoney(amount)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Refund History */}
        {refunds.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Refund Records ({refunds.length})</Text>
            {refunds.map((r, index) => {
              const amount = parseInt(r.total_minor, 10) || 0;
              return (
                <View
                  key={r.id || index}
                  style={[styles.paymentHistoryRow, index > 0 && styles.itemRowBorder]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.refundNumberText}>{r.refund_number}</Text>
                    <Text style={styles.paymentDateText}>
                      {new Date(r.occurred_at || r.created_at).toLocaleDateString()} • {r.reason?.replace(/_/g, ' ')}
                    </Text>
                    {r.sale_refund_items && r.sale_refund_items.length > 0 && (
                      <View style={styles.refundItemsList}>
                        {r.sale_refund_items.map((ri: any) => (
                          <Text key={ri.id} style={styles.refundItemDetailText}>
                            • {ri.quantity}x {ri.item_name_snapshot} {ri.restock_inventory ? '(Restocked)' : ''}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                  <Text style={styles.refundAmountText}>-{formatMoney(amount)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Order Notes */}
        {sale.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Notes</Text>
            <Text style={styles.notesText}>{sale.notes}</Text>
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
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Balance Due: {formatMoney(balanceDueMinor)}
            </Text>

            <Text style={styles.inputLabel}>Payment Amount ({currencyCode}) *</Text>
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
                { key: 'pos', label: 'POS' },
                { key: 'bank_transfer', label: 'Transfer' },
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

            <Text style={styles.inputLabel}>Reference / Cheque # (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={paymentReference}
              onChangeText={setPaymentReference}
              placeholder="e.g. POS-98124 or Transfer Ref"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, submittingPayment && styles.modalSubmitBtnDisabled]}
              onPress={handleRecordPayment}
              disabled={submittingPayment}
            >
              {submittingPayment ? (
                <ActivityIndicator color="#0A1C16" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Confirm Payment & Update Receipt</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Process Refund Modal */}
      <Modal visible={refundModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Process Sale Refund</Text>
              <TouchableOpacity onPress={() => setRefundModalVisible(false)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Select Items to Refund</Text>
              {items.map((item) => {
                const maxRefundable = getRefundableQty(item.id);
                if (maxRefundable <= 0) return null;

                const isRestock = restockItems[item.id] ?? true;

                return (
                  <View key={item.id} style={styles.refundItemCard}>
                    <View style={styles.refundItemTop}>
                      <Text style={styles.refundItemName}>
                        {item.catalog_items?.name || item.item_name_snapshot}
                      </Text>
                      <Text style={styles.refundItemMax}>Max: {maxRefundable}</Text>
                    </View>

                    <View style={styles.refundItemInputs}>
                      <View style={styles.refundQtyRow}>
                        <Text style={styles.inputSubLabel}>Qty to Refund:</Text>
                        <TextInput
                          style={styles.refundQtyInput}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          value={refundQtys[item.id] || ''}
                          onChangeText={(val) => {
                            const parsed = parseFloat(val);
                            if (isNaN(parsed) || parsed < 0) {
                              setRefundQtys({ ...refundQtys, [item.id]: '' });
                            } else if (parsed > maxRefundable) {
                              setRefundQtys({ ...refundQtys, [item.id]: maxRefundable.toString() });
                            } else {
                              setRefundQtys({ ...refundQtys, [item.id]: val });
                            }
                          }}
                        />
                      </View>

                      {item.catalog_items?.track_inventory && (
                        <View style={styles.restockRow}>
                          <Text style={styles.inputSubLabel}>Restock to Inventory?</Text>
                          <Switch
                            value={isRestock}
                            onValueChange={(val) =>
                              setRestockItems({ ...restockItems, [item.id]: val })
                            }
                            trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#B8F25C' }}
                            thumbColor="#FFF"
                          />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Refund Reason</Text>
              <View style={styles.reasonToggleGrid}>
                {[
                  { key: 'customer_return', label: 'Customer Return' },
                  { key: 'damaged', label: 'Damaged Goods' },
                  { key: 'wrong_item', label: 'Wrong Item' },
                  { key: 'correction', label: 'Correction' },
                ].map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      styles.reasonToggleBtn,
                      refundReason === r.key && styles.reasonToggleBtnActive,
                    ]}
                    onPress={() => setRefundReason(r.key)}
                  >
                    <Text
                      style={[
                        styles.reasonToggleText,
                        refundReason === r.key && styles.reasonToggleTextActive,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {netPaidMinor > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.inputLabel}>Cash / Payout Refund Method</Text>
                  <View style={styles.methodToggleRow}>
                    {[
                      { key: 'cash', label: 'Cash' },
                      { key: 'pos', label: 'POS Reversal' },
                      { key: 'bank_transfer', label: 'Transfer' },
                    ].map((m) => (
                      <TouchableOpacity
                        key={m.key}
                        style={[
                          styles.methodToggleBtn,
                          cashRefundMethod === m.key && styles.methodToggleBtnActive,
                        ]}
                        onPress={() => setCashRefundMethod(m.key as any)}
                      >
                        <Text
                          style={[
                            styles.methodToggleText,
                            cashRefundMethod === m.key && styles.methodToggleTextActive,
                          ]}
                        >
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Payout Reference (Optional)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. REF-BANK-0091"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={cashRefundReference}
                    onChangeText={setCashRefundReference}
                  />
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, submittingRefund && styles.modalSubmitBtnDisabled]}
              onPress={handleProcessRefund}
              disabled={submittingRefund}
            >
              {submittingRefund ? (
                <ActivityIndicator color="#0A1C16" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Confirm Refund & Restock</Text>
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
  errorText: { color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 16 },
  backBtnAction: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#B8F25C',
    borderRadius: 12,
  },
  backBtnActionText: { color: '#0A1C16', fontWeight: '800' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: {
    marginRight: 14,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
  shareBtn: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },

  statusCard: {
    backgroundColor: '#0E291E',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 2 },
  totalAmountText: { fontSize: 24, fontWeight: '900', color: '#B8F25C' },
  badgesRow: { flexDirection: 'row', gap: 6 },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  balanceDueLabel: { fontSize: 13, fontWeight: '700', color: '#FF9800' },
  balanceDueText: { fontSize: 16, fontWeight: '900' },

  actionButtonsContainer: { gap: 10 },
  recordPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B8F25C',
    borderRadius: 14,
    height: 48,
  },
  recordPaymentBtnText: { color: '#0A1C16', fontSize: 15, fontWeight: '900' },

  secondaryActionsRow: { flexDirection: 'row', gap: 10 },
  viewInvoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(184, 242, 92, 0.12)',
    borderRadius: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.3)',
  },
  viewInvoiceBtnText: { color: '#B8F25C', fontSize: 13, fontWeight: '800' },

  generateInvoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    height: 44,
  },
  generateInvoiceBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  refundBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    borderRadius: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  refundBtnText: { color: '#FF9800', fontSize: 13, fontWeight: '800' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 12 },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(184, 242, 92, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  customerContact: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  itemLeft: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  itemMeta: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemTotal: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  itemDiscount: { fontSize: 11, color: '#FF4D4D', marginTop: 2 },

  summaryBreakdown: { gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  summaryVal: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
    marginTop: 4,
  },

  paymentHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  paymentMethodText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  paymentDateText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  paymentAmountText: { fontSize: 15, fontWeight: '900', color: '#B8F25C' },

  refundNumberText: { fontSize: 14, fontWeight: '800', color: '#FF9800' },
  refundAmountText: { fontSize: 15, fontWeight: '900', color: '#FF4D4D' },
  refundItemsList: { marginTop: 4 },
  refundItemDetailText: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },

  notesText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0E291E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  modalSubtitle: { fontSize: 13, color: '#FF9800', fontWeight: '700', marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
  },

  methodToggleRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  methodToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  methodToggleBtnActive: { backgroundColor: '#B8F25C' },
  methodToggleText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  methodToggleTextActive: { color: '#0A1C16', fontWeight: '800' },

  modalSubmitBtn: {
    backgroundColor: '#B8F25C',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  modalSubmitBtnDisabled: { opacity: 0.6 },
  modalSubmitBtnText: { color: '#0A1C16', fontSize: 15, fontWeight: '900' },

  refundItemCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  refundItemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  refundItemName: { fontSize: 14, fontWeight: '700', color: '#FFF', flex: 1, marginRight: 8 },
  refundItemMax: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  refundItemInputs: { gap: 8 },
  refundQtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputSubLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  refundQtyInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    width: 64,
    height: 36,
    textAlign: 'center',
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  restockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  reasonToggleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  reasonToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  reasonToggleBtnActive: { backgroundColor: '#FF9800' },
  reasonToggleText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  reasonToggleTextActive: { color: '#0A1C16' },
});
