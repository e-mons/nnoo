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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../../lib/supabase';
import { useBusiness } from '../../../../../contexts/BusinessContext';
import { updateCustomerSchema } from '@nnoo/validation';
import { Feather, Ionicons } from '@expo/vector-icons';
import { UpdateCustomerDraft } from '@nnoo/contracts';

export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeBusiness } = useBusiness();
  const router = useRouter();

  const [form, setForm] = useState<Partial<UpdateCustomerDraft>>({
    customerType: 'individual',
    name: '',
    companyName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    countryCode: 'NG',
    notes: '',
  });
  const [status, setStatus] = useState<'active' | 'archived'>('active');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!activeBusiness || !id) return;
      try {
        setFetching(true);
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .eq('business_id', activeBusiness.id)
          .single();

        if (error) throw error;

        setForm({
          customerType: data.customer_type as any,
          name: data.name,
          companyName: data.company_name || '',
          phone: data.phone || '',
          email: data.email || '',
          addressLine1: data.address_line_1 || '',
          addressLine2: data.address_line_2 || '',
          city: data.city || '',
          state: data.state || '',
          countryCode: data.country_code || 'NG',
          notes: data.notes || '',
        });
        setStatus(data.status || 'active');
      } catch (err) {
        console.error('Error fetching customer for edit:', err);
        Alert.alert('Error', 'Failed to load customer details');
        router.back();
      } finally {
        setFetching(false);
      }
    };

    fetchCustomer();
  }, [id, activeBusiness]);

  const updateForm = (key: keyof UpdateCustomerDraft, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
    const errorKey = key as string;
    if (errors[errorKey]) {
      setErrors((prev: Record<string, string>) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!activeBusiness || !id) return;

    const parsed = updateCustomerSchema.safeParse(form);
    if (!parsed.success) {
      const newErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const validData = parsed.data;

      const { error } = await supabase
        .from('customers')
        .update({
          customer_type: validData.customerType,
          name: validData.name,
          company_name: validData.companyName || null,
          phone: validData.phone || null,
          email: validData.email || null,
          address_line_1: validData.addressLine1 || null,
          address_line_2: validData.addressLine2 || null,
          city: validData.city || null,
          state: validData.state || null,
          country_code: validData.countryCode || null,
          notes: validData.notes || null,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('business_id', activeBusiness.id);

      if (error) throw error;

      router.back();
    } catch (err: any) {
      console.error('Error updating customer:', err);
      Alert.alert('Error', err.message || 'Failed to update customer');
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
              <Text style={styles.headerTitle}>Edit Customer</Text>
              <Text style={styles.subtext}>Update profile and status</Text>
            </View>
          </View>

          {/* Status & Type Card */}
          <View style={styles.typeSelectorCard}>
            <Text style={styles.inputLabel}>Account Status</Text>
            <View style={styles.typeButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  status === 'active' && styles.typeButtonActive,
                ]}
                onPress={() => setStatus('active')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    status === 'active' && styles.typeButtonTextActive,
                  ]}
                >
                  Active Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  status === 'archived' && styles.typeButtonArchived,
                ]}
                onPress={() => setStatus('archived')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    status === 'archived' && styles.typeButtonTextArchived,
                  ]}
                >
                  Archived / Inactive
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Primary Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {form.customerType === 'business' ? 'Contact Person Name *' : 'Customer Full Name *'}
              </Text>
              <View style={[styles.inputBox, errors.name ? styles.inputBoxError : null]}>
                <Feather name="user" size={16} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={form.name || ''}
                  onChangeText={(val) => updateForm('name', val)}
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {form.customerType === 'business' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Company / Business Name *</Text>
                <View style={[styles.inputBox, errors.companyName ? styles.inputBoxError : null]}>
                  <Feather name="globe" size={16} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Acme Corp Ltd"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={form.companyName || ''}
                    onChangeText={(val) => updateForm('companyName', val)}
                  />
                </View>
                {errors.companyName ? (
                  <Text style={styles.errorText}>{errors.companyName}</Text>
                ) : null}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={[styles.inputBox, errors.phone ? styles.inputBoxError : null]}>
                <Feather name="phone" size={16} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.input}
                  placeholder="+234 800 000 0000"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={form.phone || ''}
                  onChangeText={(val) => updateForm('phone', val)}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputBox, errors.email ? styles.inputBoxError : null]}>
                <Feather name="mail" size={16} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.input}
                  placeholder="john@example.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={form.email || ''}
                  onChangeText={(val) => updateForm('email', val)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>
          </View>

          {/* Address Information Card */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Physical Address</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address Line 1</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Street address, unit, suite"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={form.addressLine1 || ''}
                  onChangeText={(val) => updateForm('addressLine1', val)}
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>City</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={form.city || ''}
                    onChangeText={(val) => updateForm('city', val)}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>State</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="State"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={form.state || ''}
                    onChangeText={(val) => updateForm('state', val)}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Internal Notes</Text>
            <View style={[styles.inputBox, { height: 80, alignItems: 'flex-start' }]}>
              <TextInput
                style={[styles.input, { paddingTop: 10 }]}
                placeholder="Additional notes about customer preferences, payment terms..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={form.notes || ''}
                onChangeText={(val) => updateForm('notes', val)}
                multiline
                numberOfLines={3}
              />
            </View>
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
              <Text style={styles.submitButtonText}>Save Changes</Text>
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  backButton: {
    marginRight: 14,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },

  typeSelectorCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  typeButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  typeButtonActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  typeButtonArchived: { backgroundColor: 'rgba(255, 77, 77, 0.15)', borderColor: '#FF4D4D' },
  typeButtonText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },
  typeButtonTextActive: { color: '#0A1C16' },
  typeButtonTextArchived: { color: '#FF4D4D' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardSectionTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 14 },

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

  rowInputs: { flexDirection: 'row', gap: 10 },

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
