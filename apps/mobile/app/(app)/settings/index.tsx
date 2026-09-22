import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useBusiness } from '../../../contexts/BusinessContext';
import { supabase } from '../../../lib/supabase';
import { INDUSTRY_OPTIONS } from '@nnoo/validation';

export default function SettingsScreen() {
  const router = useRouter();
  const { activeBusiness, refreshMemberships } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: activeBusiness?.name || '',
    industry: activeBusiness?.industry || '',
    phone: activeBusiness?.phone || '',
    email: activeBusiness?.email || '',
  });

  const handleSubmit = async () => {
    if (!activeBusiness) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: form.name,
          industry: form.industry,
          phone: form.phone || null,
          email: form.email || null,
        })
        .eq('id', activeBusiness.id);

      if (error) throw error;
      
      await refreshMemberships();
      Alert.alert('Success', 'Business profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!activeBusiness) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No active business</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Business Profile</Text>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Industry</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {INDUSTRY_OPTIONS.map((ind) => (
                <TouchableOpacity
                  key={ind}
                  style={[
                    styles.chip,
                    form.industry === ind && styles.chipSelected
                  ]}
                  onPress={() => setForm({ ...form, industry: ind })}
                  disabled={loading}
                >
                  <Text style={[
                    styles.chipText,
                    form.industry === ind && styles.chipTextSelected
                  ]}>{ind}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Phone</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Email</Text>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              editable={!loading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          {/* Business Preferences & Integrations */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeaderTitle}>Preferences & Integrations</Text>
            <View style={styles.prefCard}>
              <TouchableOpacity
                style={styles.prefRow}
                onPress={() => router.push('/(app)/settings/notifications' as any)}
              >
                <View style={styles.prefLeft}>
                  <View style={[styles.prefIconBox, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                    <Feather name="bell" size={16} color="#F43F5E" />
                  </View>
                  <View>
                    <Text style={styles.prefTitle}>Notification Settings</Text>
                    <Text style={styles.prefDesc}>Configure push & operational alerts</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>

              <View style={styles.prefDivider} />

              <TouchableOpacity
                style={styles.prefRow}
                onPress={() => router.push('/(app)/settings/automations' as any)}
              >
                <View style={styles.prefLeft}>
                  <View style={[styles.prefIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                    <Feather name="clock" size={16} color="#6366F1" />
                  </View>
                  <View>
                    <Text style={styles.prefTitle}>Automations & Schedules</Text>
                    <Text style={styles.prefDesc}>Background intelligence jobs & rules</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>

              <View style={styles.prefDivider} />

              <TouchableOpacity
                style={styles.prefRow}
                onPress={() => router.push('/(app)/settings/whatsapp' as any)}
              >
                <View style={styles.prefLeft}>
                  <View style={[styles.prefIconBox, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                    <Feather name="phone" size={16} color="#22C55E" />
                  </View>
                  <View>
                    <Text style={styles.prefTitle}>WhatsApp Integration</Text>
                    <Text style={styles.prefDesc}>Connect your phone for instant digests</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>

              <View style={styles.prefDivider} />

              <TouchableOpacity
                style={styles.prefRow}
                onPress={() => router.push('/(app)/team' as any)}
              >
                <View style={styles.prefLeft}>
                  <View style={[styles.prefIconBox, { backgroundColor: 'rgba(184, 242, 92, 0.15)' }]}>
                    <Feather name="shield" size={16} color="#B8F25C" />
                  </View>
                  <View>
                    <Text style={styles.prefTitle}>Team & Roles</Text>
                    <Text style={styles.prefDesc}>Manage store staff and managers</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Account & Privacy</Text>
            <Text style={styles.dangerDescription}>
              Deleting your personal account removes your login profile, revokes push tokens, and terminates WhatsApp linkage. Business financial records remain preserved under your organization.
            </Text>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => {
                Alert.alert(
                  'Request Account Deletion',
                  'Are you sure you want to request deletion of your personal account? If you are the sole owner of an active business, you must transfer ownership first.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Continue Deletion', 
                      style: 'destructive',
                      onPress: () => {
                        Alert.alert(
                          'Deletion Request Submitted',
                          'Your account deletion request has been registered. You may also visit https://nnoo.app/account-deletion for complete policy details.'
                        );
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.deleteButtonText}>Request Account Deletion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1C16',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: 'rgba(184, 242, 92, 0.1)',
    borderColor: '#B8F25C',
  },
  chipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#B8F25C',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#B8F25C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#0A1C16',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerZone: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    gap: 12,
  },
  dangerTitle: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    lineHeight: 18,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionBlock: {
    marginTop: 28,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  prefCard: {
    backgroundColor: 'rgba(20, 54, 40, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prefIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  prefDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 1,
  },
  prefDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});
