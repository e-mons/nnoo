import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useBusiness } from '../../../contexts/BusinessContext';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';

type WhatsAppStatus = {
  isConnected: boolean;
  maskedPhone: string | null;
  status: string;
};

export default function WhatsAppSettingsScreen() {
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkingCode, setLinkingCode] = useState<string | null>(null);
  const [clickToChatUrl, setClickToChatUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      const data = await api.get<WhatsAppStatus>('/api/v1/ai/whatsapp/status', {
        businessId: activeBusiness.id,
      });
      setStatus(data);
    } catch {
      setStatus({ isConnected: false, maskedPhone: null, status: 'NOT_CONNECTED' });
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const generateLinkingCode = async () => {
    if (!activeBusiness || generating) return;
    setGenerating(true);
    try {
      const data = await api.post<{ code: string; expiresAt?: string; clickToChatUrl?: string }>(
        '/api/v1/ai/whatsapp/link',
        {
          businessId: activeBusiness.id,
        }
      );
      setLinkingCode(data.code);
      setClickToChatUrl(data.clickToChatUrl || null);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to generate linking code');
    } finally {
      setGenerating(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert('Disconnect WhatsApp', 'Are you sure? You will stop receiving WhatsApp notifications.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/api/v1/ai/whatsapp/disconnect', {
              businessId: activeBusiness?.id,
            });
            setStatus({ isConnected: false, maskedPhone: null, status: 'NOT_CONNECTED' });
            setLinkingCode(null);
          } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to disconnect');
          }
        },
      },
    ]);
  };

  const openWhatsApp = () => {
    Linking.openURL('whatsapp://send?text=').catch(() => {
      Linking.openURL('https://wa.me/');
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'WhatsApp', headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#25D366" />
          </View>
        ) : status?.isConnected ? (
          <>
            {/* Connected State */}
            <View style={styles.statusCard}>
              <View style={styles.connectedDot} />
              <View>
                <Text style={styles.connectedTitle}>WhatsApp Connected</Text>
                {status.maskedPhone && (
                  <Text style={styles.phoneText}>{status.maskedPhone}</Text>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsApp}>
              <Feather name="message-circle" size={18} color="#FFFFFF" />
              <Text style={styles.whatsappButtonText}>Open WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
              <Feather name="x-circle" size={16} color="#F25C5C" />
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Not Connected State */}
            <View style={styles.setupCard}>
              <Feather name="smartphone" size={48} color="#25D366" />
              <Text style={styles.setupTitle}>Connect WhatsApp</Text>
              <Text style={styles.setupDesc}>
                Receive business alerts and notifications directly via WhatsApp.
              </Text>
            </View>

            {linkingCode ? (
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Your linking code:</Text>
                <Text style={styles.codeValue}>{linkingCode}</Text>
                <Text style={styles.codeExpiry}>Expires in 10 minutes</Text>

                {clickToChatUrl && (
                  <TouchableOpacity
                    style={[styles.whatsappButton, { marginTop: 16, width: '100%' }]}
                    onPress={() => Linking.openURL(clickToChatUrl).catch(() => openWhatsApp())}
                  >
                    <Feather name="message-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.whatsappButtonText}>Send Code via WhatsApp</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generateLinkingCode}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="link" size={18} color="#FFFFFF" />
                    <Text style={styles.generateText}>Generate Linking Code</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1C16' },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(37,211,102,0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(37,211,102,0.2)',
  },
  connectedDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#25D366' },
  connectedTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  phoneText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  whatsappButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  whatsappButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  disconnectButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(242,92,92,0.3)',
  },
  disconnectText: { fontSize: 14, fontWeight: '600', color: '#F25C5C' },
  setupCard: { alignItems: 'center', paddingVertical: 40, marginBottom: 24 },
  setupTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginTop: 16 },
  setupDesc: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 8, maxWidth: 280 },
  generateButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 14,
  },
  generateText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  codeCard: { alignItems: 'center', backgroundColor: 'rgba(37,211,102,0.08)', borderRadius: 16, padding: 28, borderWidth: 1, borderColor: 'rgba(37,211,102,0.2)' },
  codeLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  codeValue: { fontSize: 36, fontWeight: '900', color: '#25D366', letterSpacing: 8, marginVertical: 12 },
  codeExpiry: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
});
