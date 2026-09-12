import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { CreateExpenseDraftSchema } from '@nnoo/validation';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function RecordExpenseScreen() {
  const { activeBusiness } = useBusiness();
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [total, setTotal] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [externalReference, setExternalReference] = useState('');

  // Payment State
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial' | 'unpaid'>('full');
  const [partialPaymentAmount, setPartialPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'pos'>('cash');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchDependencies = async () => {
      if (!activeBusiness) return;
      try {
        const [catRes, supRes] = await Promise.all([
          supabase
            .from('expense_categories')
            .select('*')
            .eq('business_id', activeBusiness.id)
            .eq('status', 'active')
            .order('name'),
          supabase
            .from('suppliers')
            .select('id, name')
            .eq('business_id', activeBusiness.id)
            .order('name'),
        ]);

        if (catRes.data) {
          setCategories(catRes.data);
          if (catRes.data.length > 0) setCategoryId(catRes.data[0].id);
        }
        if (supRes.data) setSuppliers(supRes.data);
      } catch (err) {
        console.error('Failed to fetch expense dependencies', err);
      } finally {
        setFetching(false);
      }
    };

    fetchDependencies();
  }, [activeBusiness]);

  const handleSubmit = async () => {
    if (!activeBusiness) return;

    const totalMinor = total
      ? Math.round(parseFloat(total) * 100)
      : 0;

    const payments: any[] = [];
    if (paymentOption === 'full' && totalMinor > 0) {
      payments.push({
        amountMinor: totalMinor,
        paymentMethod,
        reference: externalReference || undefined,
      });
    } else if (paymentOption === 'partial' && partialPaymentAmount) {
      const partialMinor = Math.round(parseFloat(partialPaymentAmount) * 100);
      if (partialMinor > 0) {
        payments.push({
          amountMinor: partialMinor,
          paymentMethod,
          reference: externalReference || undefined,
        });
      }
    }

    const payload = {
      businessId: activeBusiness.id,
      categoryId,
      supplierId: supplierId ? supplierId : undefined,
      currencyCode: (activeBusiness as any)?.currency_code || 'NGN',
      totalMinor,
      effectiveDate,
      description,
      notes: notes || undefined,
      externalReference: externalReference || undefined,
      idempotencyKey: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      payments: payments.length > 0 ? payments : undefined,
    };

    // Client-side preflight check
    if (totalMinor <= 0) {
      setErrors({ total: 'Please enter a valid expense amount.' });
      Alert.alert('Validation Error', 'Please enter a valid expense amount.');
      return;
    }
    if (!description.trim()) {
      setErrors({ description: 'Description is required.' });
      Alert.alert('Validation Error', 'Description is required.');
      return;
    }
    if (paymentOption !== 'full' && !supplierId) {
      setErrors({ supplier: 'A supplier must be selected for unpaid or partial expenses.' });
      Alert.alert('Validation Error', 'A supplier must be selected for unpaid or partial expenses (accounts payable).');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const { data, error } = await supabase.rpc('create_expense', {
        payload,
      });

      if (error) throw error;

      router.back();
    } catch (err: any) {
      console.error('Error creating expense:', err);
      Alert.alert('Error', err.message || 'Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#B8F25C" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Record Expense</Text>
              <Text style={styles.subtext}>Log operational disbursement</Text>
            </View>
          </View>

          {/* Amount Card */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Expense Amount ({(activeBusiness as any)?.currency_code || 'NGN'}) *</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>
                {(activeBusiness as any)?.currency_code || 'NGN'}
              </Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={total}
                onChangeText={setTotal}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            {errors.total ? <Text style={styles.errorText}>{errors.total}</Text> : null}
          </View>

          {/* Category Selection */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Expense Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                    onPress={() => setCategoryId(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Expense Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description / Purpose *</Text>
              <View style={[styles.inputBox, errors.description ? styles.inputBoxError : null]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Office Generator Fuel / Internet Renewal"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
              {errors.description ? (
                <Text style={styles.errorText}>{errors.description}</Text>
              ) : null}
            </View>

            {/* Supplier Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Supplier / Payee {paymentOption !== 'full' ? '*' : '(Optional)'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.supplierScroll}>
                <TouchableOpacity
                  style={[
                    styles.supplierChip,
                    !supplierId && styles.supplierChipActive,
                  ]}
                  onPress={() => setSupplierId('')}
                >
                  <Text
                    style={[
                      styles.supplierChipText,
                      !supplierId && styles.supplierChipTextActive,
                    ]}
                  >
                    Walk-up / None
                  </Text>
                </TouchableOpacity>
                {suppliers.map((sup) => {
                  const isSelected = supplierId === sup.id;
                  return (
                    <TouchableOpacity
                      key={sup.id}
                      style={[styles.supplierChip, isSelected && styles.supplierChipActive]}
                      onPress={() => setSupplierId(sup.id)}
                    >
                      <Text
                        style={[
                          styles.supplierChipText,
                          isSelected && styles.supplierChipTextActive,
                        ]}
                      >
                        {sup.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {errors.supplier ? (
                <Text style={styles.errorText}>{errors.supplier}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Effective Date</Text>
              <View style={styles.inputBox}>
                <Feather name="calendar" size={16} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={effectiveDate}
                  onChangeText={setEffectiveDate}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Invoice / Receipt Reference</Text>
              <View style={styles.inputBox}>
                <Feather name="hash" size={16} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. REC-84920 / INV-1002"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={externalReference}
                  onChangeText={setExternalReference}
                />
              </View>
            </View>
          </View>

          {/* Payment Terms Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Terms</Text>

            <View style={styles.paymentOptionsRow}>
              {[
                { key: 'full', label: 'Paid in Full' },
                { key: 'partial', label: 'Partial Pay' },
                { key: 'unpaid', label: 'On Credit' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.paymentOptionBtn,
                    paymentOption === opt.key && styles.paymentOptionBtnActive,
                  ]}
                  onPress={() => setPaymentOption(opt.key as any)}
                >
                  <Text
                    style={[
                      styles.paymentOptionText,
                      paymentOption === opt.key && styles.paymentOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentOption === 'partial' && (
              <View style={[styles.inputGroup, { marginTop: 14 }]}>
                <Text style={styles.inputLabel}>Amount Paid Today *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={partialPaymentAmount}
                    onChangeText={setPartialPaymentAmount}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            )}

            {paymentOption !== 'unpaid' && (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>Disbursement Channel</Text>
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
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0A1C16" />
            ) : (
              <Text style={styles.submitButtonText}>Record Expense</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  backButton: { marginRight: 14, padding: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  amountCard: {
    backgroundColor: '#0E291E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
  },
  amountLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginBottom: 6 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { fontSize: 24, fontWeight: '900', color: '#B8F25C', marginRight: 8 },
  amountInput: { fontSize: 32, fontWeight: '900', color: '#FFF', flex: 1 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 12 },

  categoryScroll: { flexDirection: 'row', marginTop: 4 },
  categoryChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  categoryChipActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  categoryChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },
  categoryChipTextActive: { color: '#0A1C16' },

  supplierScroll: { flexDirection: 'row', marginTop: 6 },
  supplierChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  supplierChipActive: { backgroundColor: 'rgba(184, 242, 92, 0.2)', borderColor: '#B8F25C' },
  supplierChipText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' },
  supplierChipTextActive: { color: '#B8F25C' },

  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginBottom: 6 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 10,
  },
  inputBoxError: { borderColor: '#FF4D4D' },
  input: { flex: 1, color: '#FFF', fontSize: 14 },
  errorText: { color: '#FF4D4D', fontSize: 12, marginTop: 4, fontWeight: '600' },

  paymentOptionsRow: { flexDirection: 'row', gap: 8 },
  paymentOptionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  paymentOptionBtnActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  paymentOptionText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  paymentOptionTextActive: { color: '#0A1C16' },

  methodsRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
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

  submitButton: {
    backgroundColor: '#B8F25C',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#0A1C16', fontWeight: '900', fontSize: 16 },
});
