import React, { useState } from 'react';
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
import { useAuth } from '../../../../context/AuthContext';
import { createCustomerSchema } from '@nnoo/validation';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CreateCustomerDraft } from '@nnoo/contracts';

export default function NewCustomerScreen() {
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<Partial<CreateCustomerDraft>>({
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

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateForm = (key: keyof CreateCustomerDraft, value: string) => {
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
    if (!activeBusiness || !user) return;

    const parsed = createCustomerSchema.safeParse(form);
    if (!parsed.success) {
      const newErrors: Record<string, string> = {};
      let firstMessage = '';
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
        if (!firstMessage) firstMessage = err.message;
      });
      setErrors(newErrors);
      Alert.alert('Validation Error', firstMessage || 'Please check all required fields.');
      return;
    }

    setLoading(true);

    try {
      const validData = parsed.data;

      const { error } = await supabase
        .from('customers')
        .insert({
          business_id: activeBusiness.id,
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
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      router.back();
    } catch (err: any) {
      console.error('Error creating customer:', err);
      Alert.alert('Error', err.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

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
              <Text style={styles.headerTitle}>New Customer</Text>
              <Text style={styles.subtext}>Add client profile to workspace</Text>
            </View>
          </View>

          {/* Customer Type Switcher */}
          <View style={styles.typeSelectorCard}>
            <Text style={styles.inputLabel}>Customer Type</Text>
            <View style={styles.typeButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  form.customerType === 'individual' && styles.typeButtonActive,
                ]}
                onPress={() => updateForm('customerType', 'individual')}
              >
                <Feather
                  name="user"
                  size={16}
                  color={form.customerType === 'individual' ? '#0A1C16' : '#FFF'}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    form.customerType === 'individual' && styles.typeButtonTextActive,
                  ]}
                >
                  Individual
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  form.customerType === 'business' && styles.typeButtonActive,
                ]}
                onPress={() => updateForm('customerType', 'business')}
              >
                <Feather
                  name="briefcase"
                  size={16}
                  color={form.customerType === 'business' ? '#0A1C16' : '#FFF'}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    form.customerType === 'business' && styles.typeButtonTextActive,
                  ]}
                >
                  Corporate / Business
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Primary Contact Information</Text>

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
              <Text style={styles.submitButtonText}>Create Customer</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  typeButtonActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  typeButtonText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },
  typeButtonTextActive: { color: '#0A1C16' },

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
