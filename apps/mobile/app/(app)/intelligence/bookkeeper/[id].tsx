import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { api } from '../../../../lib/api';

import * as Crypto from 'expo-crypto';

type Classification = {
  id: string;
  description: string;
  operation_kind: string;
  confidence_band: string;
  classification_status: string;
  amount_minor: number | null;
  currency_code: string;
  payment_method: string | null;
  counterparty_text: string | null;
  short_explanation: string;
  transaction_direction: string | null;
  transaction_date: string | null;
  expense_category_candidate_id?: string | null;
  supplier_candidate_id?: string | null;
  customer_candidate_id?: string | null;
  warning_codes: string[];
  missing_fields: string[];
  created_at: string;
};

export default function BookkeeperDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const [item, setItem] = useState<Classification | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItem = useCallback(async () => {
    if (!activeBusiness || !id) return;
    try {
      setError(null);
      const { data, error: queryError } = await supabase
        .from('ai_bookkeeping_classifications')
        .select('*')
        .eq('id', id)
        .eq('business_id', activeBusiness.id)
        .single();

      if (queryError) throw queryError;
      setItem(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load classification');
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleConfirm = async () => {
    if (!item || !activeBusiness || !user || acting) return;
    setActing(true);
    try {
      const idempotencyKey = Crypto.randomUUID();
      let finalKind = item.operation_kind;
      if (finalKind === 'EXPENSE' || finalKind === 'operating_expense') finalKind = 'OPERATING_EXPENSE';

      let payload: any = {};
      if (finalKind === 'OPERATING_EXPENSE') {
        payload = {
          amountMinor: item.amount_minor || 0,
          expenseCategoryId: item.expense_category_candidate_id || '00000000-0000-0000-0000-000000000000',
          description: item.description,
          occurredAt: item.transaction_date || new Date().toISOString().split('T')[0],
          supplierId: item.supplier_candidate_id || undefined,
          payment: item.amount_minor ? {
            amountMinor: item.amount_minor,
            paymentMethod: item.payment_method || 'cash',
          } : undefined,
        };
      }

      await api.post(`/api/v1/ai/bookkeeper/reviews/${item.id}/apply`, {
        businessId: activeBusiness.id,
        classificationId: item.id,
        finalOperationKind: finalKind,
        payload,
        idempotencyKey,
      });

      Alert.alert('Confirmed', 'Classification has been confirmed and posted to your ledger.');
      router.back();
    } catch (err: unknown) {
      Alert.alert('Confirmation Error', err instanceof Error ? err.message : 'Failed to confirm classification');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!item || !activeBusiness || !user || acting) return;
    setActing(true);
    try {
      await api.post(`/api/v1/ai/bookkeeper/reviews/${item.id}/reject`, {
        businessId: activeBusiness.id,
        classificationId: item.id,
        reasonCode: 'OTHER',
        notes: 'Rejected by user',
      });

      Alert.alert('Rejected', 'Classification has been rejected with zero financial mutations.');
      router.back();
    } catch (err: unknown) {
      Alert.alert('Rejection Error', err instanceof Error ? err.message : 'Failed to reject classification');
    } finally {
      setActing(false);
    }
  };

  const formatAmount = (amountMinor: number | null, currency: string) => {
    if (amountMinor === null) return '—';
    return `${currency} ${(amountMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Classification', headerShown: true }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#B8F25C" />
        </View>
      </>
    );
  }

  if (error || !item) {
    return (
      <>
        <Stack.Screen options={{ title: 'Classification', headerShown: true }} />
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color="#F25C5C" />
          <Text style={styles.errorText}>{error || 'Classification not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchItem}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const isPending = item.classification_status?.toLowerCase() === 'pending_review';

  return (
    <>
      <Stack.Screen options={{ title: 'Classification Detail', headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* AI Explanation */}
        <View style={styles.section}>
          <View style={styles.aiHeader}>
            <Feather name="cpu" size={16} color="#B8F25C" />
            <Text style={styles.aiLabel}>AI Analysis</Text>
          </View>
          <Text style={styles.explanation}>{item.short_explanation}</Text>
        </View>

        {/* Details Card */}
        <View style={styles.detailCard}>
          <DetailRow label="Description" value={item.description} />
          <DetailRow label="Operation" value={item.operation_kind.replace(/_/g, ' ')} />
          <DetailRow label="Amount" value={formatAmount(item.amount_minor, item.currency_code)} highlight />
          <DetailRow label="Direction" value={item.transaction_direction || '—'} />
          <DetailRow label="Payment" value={item.payment_method || '—'} />
          <DetailRow label="Counterparty" value={item.counterparty_text || '—'} />
          <DetailRow label="Date" value={item.transaction_date || '—'} />
          <DetailRow label="Confidence" value={item.confidence_band} />
          <DetailRow label="Status" value={item.classification_status} />
        </View>

        {/* Warning Codes */}
        {Array.isArray(item.warning_codes) && item.warning_codes.length > 0 && (
          <View style={styles.warningSection}>
            <Feather name="alert-triangle" size={16} color="#F2C85C" />
            <Text style={styles.warningTitle}>Warnings</Text>
            {item.warning_codes.map((code, i) => (
              <Text key={i} style={styles.warningCode}>• {String(code)}</Text>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={acting}
            >
              {acting ? (
                <ActivityIndicator size="small" color="#0A1C16" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#0A1C16" />
                  <Text style={styles.confirmText}>Confirm</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleReject}
              disabled={acting}
            >
              <Feather name="x" size={18} color="#F25C5C" />
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={[detailStyles.value, highlight && detailStyles.highlight]}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  label: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  value: { fontSize: 14, color: '#FFFFFF', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  highlight: { color: '#B8F25C', fontSize: 16, fontWeight: '800' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1C16' },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, backgroundColor: '#0A1C16', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  errorText: { color: '#F25C5C', fontSize: 14, marginTop: 12, textAlign: 'center' },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#B8F25C', borderRadius: 12 },
  retryText: { color: '#0A1C16', fontWeight: '700', fontSize: 14 },
  section: { marginBottom: 20 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  aiLabel: { fontSize: 13, fontWeight: '700', color: '#B8F25C' },
  explanation: { fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 22 },
  detailCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(184,242,92,0.08)' },
  warningSection: { backgroundColor: 'rgba(242,200,92,0.08)', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(242,200,92,0.2)' },
  warningTitle: { fontSize: 14, fontWeight: '700', color: '#F2C85C', marginBottom: 8, marginLeft: 4 },
  warningCode: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginLeft: 8, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  confirmButton: { backgroundColor: '#B8F25C' },
  rejectButton: { backgroundColor: 'rgba(242,92,92,0.12)', borderWidth: 1, borderColor: 'rgba(242,92,92,0.3)' },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#0A1C16' },
  rejectText: { fontSize: 15, fontWeight: '700', color: '#F25C5C' },
});
