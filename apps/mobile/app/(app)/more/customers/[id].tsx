import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Badge } from '../../../../components/Badge';
import { MoneyText } from '../../../../components/MoneyText';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currencyCode = (activeBusiness as any)?.currency_code || 'NGN';

  const fetchCustomer = async () => {
    if (!activeBusiness || !id) return;
    try {
      const [custRes, invRes, salesRes] = await Promise.all([
        supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .eq('business_id', activeBusiness.id)
          .single(),
        supabase
          .from('invoices')
          .select('id, invoice_number, document_status, total_minor, due_date, created_at, sales(payment_status)')
          .eq('customer_id', id)
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('sales')
          .select('id, sale_number, payment_status, total_minor, occurred_at')
          .eq('customer_id', id)
          .eq('business_id', activeBusiness.id)
          .order('occurred_at', { ascending: false })
          .limit(10),
      ]);

      if (custRes.error) throw custRes.error;
      setCustomer(custRes.data);
      setInvoices(invRes.data || []);
      setSales(salesRes.data || []);
    } catch (err: any) {
      console.error('Error fetching customer details', err);
      Alert.alert('Error', 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomer();
    }, [id, activeBusiness])
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color="#B8F25C" />
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.errorText}>Customer not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const unpaidSales = sales.filter((s) => s.payment_status !== 'paid');
  const outstandingMinor = unpaidSales.reduce(
    (sum, s) => sum + (parseInt(s.total_minor, 10) || 0),
    0
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/more/customers/${customer.id}/edit`)}
          style={styles.iconButton}
        >
          <Ionicons name="pencil" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Section */}
        <View style={styles.topSection}>
          <Text style={styles.name}>{customer.name}</Text>
          {customer.company_name && (
            <View style={styles.companyRow}>
              <Ionicons name="business" size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.companyName}>{customer.company_name}</Text>
            </View>
          )}
          <View style={styles.badges}>
            <Badge
              label={customer.status}
              variant={customer.status === 'active' ? 'success' : 'default'}
            />
            <Badge
              label={customer.customer_type}
              variant={customer.customer_type === 'business' ? 'warning' : 'default'}
            />
          </View>
        </View>

        {/* Outstanding Receivables Banner */}
        {outstandingMinor > 0 && (
          <View style={styles.receivablesBanner}>
            <View>
              <Text style={styles.receivablesLabel}>Outstanding Balance Due</Text>
              <MoneyText amountMinor={outstandingMinor} style={styles.receivablesAmount} />
            </View>
            <TouchableOpacity
              style={styles.newInvoiceBtn}
              onPress={() => router.push('/(app)/invoices/new' as any)}
            >
              <Text style={styles.newInvoiceBtnText}>Bill Customer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="rgba(255,255,255,0.4)" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{customer.email || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="rgba(255,255,255,0.4)" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{customer.phone || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        {/* Invoices History */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Invoices ({invoices.length})</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/invoices/new' as any)}>
              <Text style={styles.headerActionText}>+ New</Text>
            </TouchableOpacity>
          </View>

          {invoices.length === 0 ? (
            <Text style={styles.emptyHistoryText}>No invoices billed to this customer.</Text>
          ) : (
            invoices.map((inv, idx) => {
              const isPaid = inv.sales?.payment_status === 'paid';
              return (
                <TouchableOpacity
                  key={inv.id || idx}
                  style={[styles.historyRow, idx > 0 && styles.historyRowBorder]}
                  onPress={() => router.push(`/(app)/invoices/${inv.id}` as any)}
                >
                  <View>
                    <Text style={styles.historyDocNumber}>
                      {inv.invoice_number || 'Draft Invoice'}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(inv.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <MoneyText amountMinor={inv.total_minor} style={styles.historyAmount} />
                    <Badge
                      label={
                        inv.document_status === 'draft'
                          ? 'Draft'
                          : isPaid
                          ? 'Paid'
                          : 'Unpaid'
                      }
                      variant={
                        isPaid
                          ? 'success'
                          : inv.document_status === 'draft'
                          ? 'default'
                          : 'warning'
                      }
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Address</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="rgba(255,255,255,0.4)" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Physical Address</Text>
              {customer.address_line_1 ? (
                <View style={styles.addressBlock}>
                  <Text style={styles.infoValue}>{customer.address_line_1}</Text>
                  {customer.address_line_2 ? <Text style={styles.infoValue}>{customer.address_line_2}</Text> : null}
                  <Text style={styles.infoValue}>
                    {[customer.city, customer.state, customer.country_code].filter(Boolean).join(', ')}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.infoValue, { fontStyle: 'italic', color: 'rgba(255,255,255,0.4)' }]}>No address provided</Text>
              )}
            </View>
          </View>
        </View>

        {/* Internal Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Internal Notes</Text>
          {customer.notes ? (
            <Text style={styles.notesText}>{customer.notes}</Text>
          ) : (
            <Text style={[styles.notesText, { fontStyle: 'italic', color: 'rgba(255,255,255,0.4)' }]}>No internal notes for this customer.</Text>
          )}

          <View style={styles.metaData}>
            <Text style={styles.metaText}>Created: {new Date(customer.created_at).toLocaleDateString()}</Text>
            <Text style={styles.metaText}>ID: {customer.id}</Text>
          </View>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  iconButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 50 },

  topSection: { marginBottom: 16, marginTop: 6 },
  name: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.5, marginBottom: 6 },
  companyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  companyName: { fontSize: 15, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  badges: { flexDirection: 'row', gap: 8 },

  receivablesBanner: {
    backgroundColor: '#0E291E',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.4)',
  },
  receivablesLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 4 },
  receivablesAmount: { fontSize: 22, fontWeight: '900', color: '#FF9800' },
  newInvoiceBtn: {
    backgroundColor: '#B8F25C',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  newInvoiceBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 13 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#FFF', marginBottom: 14 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerActionText: { color: '#B8F25C', fontWeight: '800', fontSize: 14 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  infoIcon: { marginTop: 2, marginRight: 12 },
  infoLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#FFF', fontWeight: '600' },
  addressBlock: { gap: 2 },
  notesText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22 },
  metaData: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', gap: 4 },
  metaText: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },

  emptyHistoryText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  historyRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  historyDocNumber: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  historyDate: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  historyAmount: { fontSize: 15, fontWeight: '800', color: '#B8F25C', marginBottom: 4 },

  errorText: { color: '#FFF', fontSize: 16, marginBottom: 16 },
  backButton: { backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  backButtonText: { color: '#FFF', fontWeight: 'bold' },
});
