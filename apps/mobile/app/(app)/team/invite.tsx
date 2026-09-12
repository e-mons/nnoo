import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useBusiness } from '../../../contexts/BusinessContext';
import { supabase } from '../../../lib/supabase';
import { BUSINESS_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, BusinessRole } from '@nnoo/validation';
import * as Crypto from 'expo-crypto';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function InviteMemberScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<BusinessRole>('sales_staff');
  const [error, setError] = useState<string | null>(null);

  if (!activeBusiness) return null;

  async function handleInvite() {
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate secure random token
      const rawToken = Crypto.randomUUID() + Crypto.randomUUID();

      // Hash it with SHA-256 for database storage
      const tokenHashBytes = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawToken
      );

      const { error: rpcError } = await supabase.rpc('create_business_invitation', {
        p_business_id: activeBusiness!.id,
        p_email: email.trim().toLowerCase(),
        p_role: selectedRole,
        p_token_hash: tokenHashBytes,
        p_expires_in_days: 7,
      });

      if (rpcError) throw rpcError;

      // Construct invite link for web and mobile deep-linking
      const appBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://nnoo.app';
      const link = `${appBaseUrl}/invitations/${rawToken}`;

      // Open native Share sheet
      await Share.share({
        message: `You have been invited to join ${activeBusiness!.name} on NNOO as ${ROLE_LABELS[selectedRole as keyof typeof ROLE_LABELS] || selectedRole}.\n\nAccept your invitation here:\n${link}`,
        url: link,
        title: `Join ${activeBusiness!.name} on NNOO`,
      });

      router.back();
    } catch (err: any) {
      console.error('Invite creation error:', err);
      setError(err.message || 'Failed to create invitation.');
    } finally {
      setLoading(false);
    }
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
              <Text style={styles.headerTitle}>Invite Member</Text>
              <Text style={styles.subtext}>Send invite link with assigned permissions</Text>
            </View>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={18} color="#FF4D4D" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email Input Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Member Email Address *</Text>
            <View style={styles.inputBox}>
              <Feather name="mail" size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.input}
                placeholder="colleague@example.com"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Role Selection */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Assign Team Role</Text>
            <Text style={styles.sectionSubtext}>
              Select the level of access granted to this member.
            </Text>

            <View style={styles.rolesContainer}>
              {BUSINESS_ROLES.filter((r) => r !== 'owner').map((role) => {
                const isSelected = selectedRole === role;
                return (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                    onPress={() => setSelectedRole(role as BusinessRole)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roleHeader}>
                      <View style={[styles.radio, isSelected && styles.radioSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.roleName, isSelected && styles.roleNameActive]}>
                        {ROLE_LABELS[role as keyof typeof ROLE_LABELS]}
                      </Text>
                    </View>
                    <Text style={styles.roleDesc}>
                      {ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleInvite}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0A1C16" />
            ) : (
              <>
                <Feather name="send" size={18} color="#0A1C16" />
                <Text style={styles.submitButtonText}>Generate Invite & Share Link</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  backButton: { marginRight: 14, padding: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderWidth: 1,
    borderColor: '#FF4D4D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  errorText: { color: '#FF4D4D', fontSize: 13, fontWeight: '600', flex: 1 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  sectionSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16 },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 10,
    marginTop: 6,
  },
  input: { flex: 1, color: '#FFF', fontSize: 15 },

  rolesContainer: { gap: 10 },
  roleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  roleCardSelected: {
    backgroundColor: 'rgba(184, 242, 92, 0.08)',
    borderColor: '#B8F25C',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioSelected: {
    borderColor: '#B8F25C',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#B8F25C',
  },
  roleName: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  roleNameActive: {
    color: '#B8F25C',
  },
  roleDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 18,
    paddingLeft: 30,
  },

  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B8F25C',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 40,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#0A1C16', fontWeight: '900', fontSize: 16 },
});
