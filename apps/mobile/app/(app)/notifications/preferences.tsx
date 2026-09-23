import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useBusiness } from '../../../contexts/BusinessContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

type PreferenceRow = {
  id: string;
  category: string;
  channel: string;
  enabled: boolean;
};

const CATEGORIES = [
  'INVENTORY',
  'INVOICES',
  'BOOKKEEPER',
  'BUSINESS_HEALTH',
  'CREDIT_PASSPORT',
  'BUSINESS_SUMMARIES',
  'AUTOMATIONS',
] as const;

const CHANNELS = ['IN_APP', 'PUSH', 'WHATSAPP'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  INVENTORY: 'Inventory',
  INVOICES: 'Invoices',
  BOOKKEEPER: 'AI Bookkeeper',
  BUSINESS_HEALTH: 'Business Health',
  CREDIT_PASSPORT: 'Credit Passport',
  BUSINESS_SUMMARIES: 'Smart Insights',
  AUTOMATIONS: 'Automations',
};

const CHANNEL_LABELS: Record<string, string> = {
  IN_APP: 'In-App',
  PUSH: 'Push',
  WHATSAPP: 'WhatsApp',
};

export default function NotificationPreferencesScreen() {
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<PreferenceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrefs = useCallback(async () => {
    if (!activeBusiness || !user) return;
    try {
      const { data } = await supabase
        .from('notification_preferences')
        .select('id, category, channel, enabled')
        .eq('business_id', activeBusiness.id)
        .eq('user_id', user.id);

      setPrefs(data || []);
    } catch (err: unknown) {
      console.error('[NotificationPreferences] Failed to load preferences:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, user]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const getPref = (category: string, channel: string): boolean => {
    const found = prefs.find((p) => p.category === category && p.channel === channel);
    return found ? found.enabled : true; // Default to enabled
  };

  const togglePref = async (category: string, channel: string) => {
    if (!activeBusiness || !user) return;

    const existing = prefs.find((p) => p.category === category && p.channel === channel);
    const newEnabled = existing ? !existing.enabled : false;

    if (existing) {
      await supabase
        .from('notification_preferences')
        .update({ enabled: newEnabled, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      setPrefs((prev) => prev.map((p) => (p.id === existing.id ? { ...p, enabled: newEnabled } : p)));
    } else {
      const { data } = await supabase
        .from('notification_preferences')
        .insert({
          business_id: activeBusiness.id,
          user_id: user.id,
          category,
          channel,
          enabled: newEnabled,
          updated_by_user_id: user.id,
        })
        .select('id, category, channel, enabled')
        .single();

      if (data) setPrefs((prev) => [...prev, data]);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Notification Preferences', headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#B8F25C" />
          </View>
        ) : (
          <>
            {/* Channel header */}
            <View style={styles.headerRow}>
              <View style={styles.categoryCol} />
              {CHANNELS.map((ch) => (
                <View key={ch} style={styles.channelCol}>
                  <Text style={styles.channelLabel}>{CHANNEL_LABELS[ch]}</Text>
                </View>
              ))}
            </View>

            {/* Category rows */}
            {CATEGORIES.map((cat) => (
              <View key={cat} style={styles.prefRow}>
                <View style={styles.categoryCol}>
                  <Text style={styles.categoryLabel}>{CATEGORY_LABELS[cat]}</Text>
                </View>
                {CHANNELS.map((ch) => (
                  <View key={ch} style={styles.channelCol}>
                    <Switch
                      value={getPref(cat, ch)}
                      onValueChange={() => togglePref(cat, ch)}
                      trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(184,242,92,0.4)' }}
                      thumbColor={getPref(cat, ch) ? '#B8F25C' : '#666'}
                    />
                  </View>
                ))}
              </View>
            ))}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', marginBottom: 8 },
  categoryCol: { flex: 2 },
  channelCol: { flex: 1, alignItems: 'center' },
  channelLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  categoryLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});
