import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { MoneyText } from '../../../../components/MoneyText';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function CustomerReceiptDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { activeBusiness } = useBusiness();

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<any>(null);

  const currencyCode = (activeBusiness as any)?.currency_code || 'NGN';

  const fetchReceiptDetails = async () => {
    if (!activeBusiness || !id) return;
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('id', id)
        .eq('business_id', activeBusiness.id)
        .single();

      if (error) throw error;
      setReceipt(data);
    } catch (err: any) {
      console.error('Error fetching receipt details:', err);
      Alert.alert('Error', err.message || 'Failed to load receipt details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceiptDetails();
  }, [id, activeBusiness]);

  const handleShareReceipt = async () => {
    if (!receipt) return;
    try {
      const customerName = receipt.customer_snapshot?.name || 'Walk-in Customer';
      const balanceDue = parseInt(receipt.balance_after_payment_minor || '0', 10);

      const shareText =
        `OFFICIAL PAYMENT RECEIPT\n` +
        `Receipt #: ${receipt.receipt_number}\n` +
        `Business: ${activeBusiness?.name}\n` +
        `Customer: ${customerName}\n` +
        `Order Ref: ${receipt.sale_number_snapshot}\n` +
        (receipt.invoice_number_snapshot ? `Invoice Ref: ${receipt.invoice_number_snapshot}\n` : '') +
        `Amount Paid: ${currencyCode} ${(parseInt(receipt.amount_minor, 10) / 100).toFixed(2)}\n` +
        `Payment Method: ${receipt.payment_method_snapshot?.replace(/_/g, ' ').toUpperCase()}\n` +
        `Date: ${new Date(receipt.payment_occurred_at).toLocaleString()}\n` +
        `Remaining Balance: ${currencyCode} ${(balanceDue / 100).toFixed(2)}\n\n` +
        `Thank you for your business!`;

      await Share.share({
        message: shareText,
        title: `Payment Receipt ${receipt.receipt_number}`,
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

  if (!receipt) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.errorText}>Receipt not found.</Text>
        <TouchableOpacity style={styles.backBtnAction} onPress={() => router.back()}>
          <Text style={styles.backBtnActionText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const customer = receipt.customer_snapshot;
  const balanceAfter = parseInt(receipt.balance_after_payment_minor || '0', 10);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{receipt.receipt_number}</Text>
            <Text style={styles.subtext}>Verified Customer Payment</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShareReceipt}>
          <Feather name="share-2" size={20} color="#B8F25C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Receipt Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.checkIconBox}>
            <Feather name="check" size={28} color="#0A1C16" />
          </View>

          <Text style={styles.paidStatusLabel}>Payment Confirmed</Text>
          <MoneyText amountMinor={receipt.amount_minor} style={styles.heroAmount} />
          <Text style={styles.heroDate}>
            {new Date(receipt.payment_occurred_at).toLocaleString()}
          </Text>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Payment Method</Text>
            <Text style={styles.metaValue}>
              {receipt.payment_method_snapshot?.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>

          {receipt.payment_reference_snapshot ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Transaction Ref</Text>
              <Text style={styles.metaValue}>{receipt.payment_reference_snapshot}</Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Sales Order</Text>
            <Text style={styles.metaValueHighlight}>{receipt.sale_number_snapshot}</Text>
          </View>

          {receipt.invoice_number_snapshot ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Linked Invoice</Text>
              <Text style={styles.metaValueHighlight}>{receipt.invoice_number_snapshot}</Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Balance After Payment</Text>
            <Text style={[styles.metaValue, { color: balanceAfter > 0 ? '#FF9800' : '#B8F25C' }]}>
              {currencyCode} {(balanceAfter / 100).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Customer Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Received From</Text>
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <Feather name="user" size={18} color="#B8F25C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>
                {customer?.name || 'Walk-in Customer'}
              </Text>
              <Text style={styles.customerContact}>
                {customer?.email || customer?.phone || 'Direct payment without registered account'}
              </Text>
            </View>
          </View>
        </View>

        {/* Share Receipt Action */}
        <TouchableOpacity
          style={styles.actionShareBtn}
          onPress={handleShareReceipt}
          activeOpacity={0.8}
        >
          <Feather name="send" size={18} color="#0A1C16" />
          <Text style={styles.actionShareBtnText}>Share Official Receipt</Text>
        </TouchableOpacity>
      </ScrollView>
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

  heroCard: {
    backgroundColor: '#0E291E',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
    marginBottom: 16,
  },
  checkIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#B8F25C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  paidStatusLabel: { fontSize: 13, color: '#B8F25C', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroAmount: { fontSize: 34, fontWeight: '900', color: '#FFF', marginVertical: 6 },
  heroDate: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 },

  divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 14 },

  metaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  metaLabel: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  metaValue: { fontSize: 14, color: '#FFF', fontWeight: '700' },
  metaValueHighlight: { fontSize: 14, color: '#B8F25C', fontWeight: '800' },

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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  customerContact: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  actionShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B8F25C',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  actionShareBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 15 },

  errorText: { color: '#FFF', fontSize: 16, marginBottom: 16 },
  backBtnAction: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backBtnActionText: { color: '#FFF', fontWeight: 'bold' },
});
