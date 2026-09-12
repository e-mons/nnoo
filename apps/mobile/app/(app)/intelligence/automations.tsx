import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useBusiness } from '../../../contexts/BusinessContext';
import { supabase } from '../../../lib/supabase';
import { api } from '../../../lib/api';
import * as Crypto from 'expo-crypto';

type Automation = {
  id: string;
  businessId?: string;
  business_id?: string;
  automationType?: string;
  automation_type?: string;
  enabled: boolean;
  frequency: string;
  scheduleLocalTime?: string;
  schedule_local_time?: string;
  scheduleWeekday?: number | null;
  schedule_weekday?: number | null;
  scheduleMonthday?: number | null;
  schedule_monthday?: number | null;
};

const AUTOMATION_INFO: Record<string, { title: string; description: string; icon: keyof typeof Feather.glyphMap; color: string }> = {
  business_summary: {
    title: 'Daily Business Summary',
    description: 'AI-generated summary of your business activity and cash flow',
    icon: 'sun',
    color: '#F2C85C',
  },
  health_score_refresh: {
    title: 'Health Score Refresh',
    description: 'Automated business financial health score recalculation',
    icon: 'heart',
    color: '#F25C8A',
  },
  attention_scan: {
    title: 'Attention & Anomaly Scan',
    description: 'Automated scanning for overdue invoices, low stock, and anomalies',
    icon: 'zap',
    color: '#C85CF2',
  },
  DAILY_BUSINESS_SUMMARY: {
    title: 'Daily Business Summary',
    description: 'AI-generated summary of your business activity',
    icon: 'sun',
    color: '#F2C85C',
  },
  WEEKLY_HEALTH_CHECK: {
    title: 'Weekly Health Check',
    description: 'Automated business health score refresh',
    icon: 'heart',
    color: '#F25C8A',
  },
  AUTO_CLASSIFY_TRANSACTIONS: {
    title: 'Auto-Classify Transactions',
    description: 'Automatically classify new transactions with AI',
    icon: 'zap',
    color: '#C85CF2',
  },
};

export default function AutomationsScreen() {
  const { activeBusiness } = useBusiness();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomations = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      setError(null);
      // First try API route for canonical defaults
      try {
        const res = await api.get<{ automations: Automation[] }>(
          `/api/v1/ai/automations?businessId=${activeBusiness.id}`
        );
        if (res?.automations && res.automations.length > 0) {
          setAutomations(res.automations);
          return;
        }
      } catch {
        // Fallback to Supabase query
      }

      const { data, error: queryError } = await supabase
        .from('business_automations')
        .select('*')
        .eq('business_id', activeBusiness.id)
        .order('automation_type');

      if (queryError) throw queryError;
      setAutomations(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load automations');
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const toggleAutomation = async (automation: Automation) => {
    if (!activeBusiness || toggling) return;
    const type = automation.automationType || automation.automation_type || '';
    const rawFreq = (automation.frequency || 'daily').toLowerCase();
    const frequency = !automation.enabled
      ? (rawFreq === 'off' ? 'daily' : rawFreq)
      : 'off';
    const weekday = automation.scheduleWeekday ?? automation.schedule_weekday ?? null;
    const monthday = automation.scheduleMonthday ?? automation.schedule_monthday ?? null;

    setToggling(automation.id);
    try {
      await api.post('/api/v1/ai/automations', {
        businessId: activeBusiness.id,
        automationType: type,
        enabled: !automation.enabled,
        frequency,
        scheduleLocalTime: automation.scheduleLocalTime || automation.schedule_local_time || '09:00',
        scheduleWeekday: frequency === 'weekly' ? (weekday || 1) : null,
        scheduleMonthday: frequency === 'monthly' ? (monthday || 1) : null,
      });

      setAutomations((prev) =>
        prev.map((a) => (a.id === automation.id ? { ...a, enabled: !a.enabled, frequency } : a))
      );
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to toggle automation');
    } finally {
      setToggling(null);
    }
  };

  const handleRunNow = async (automationType: string) => {
    if (!activeBusiness || running) return;
    setRunning(automationType);
    try {
      await api.post('/api/v1/ai/automations/run', {
        businessId: activeBusiness.id,
        automationType,
        idempotencyKey: Crypto.randomUUID(),
      });
      Alert.alert('Started', 'Automation has been triggered. Results will appear shortly.');
      await fetchAutomations();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to run automation');
    } finally {
      setRunning(null);
    }
  };

  const formatSchedule = (a: Automation) => {
    const time = a.scheduleLocalTime || a.schedule_local_time || '09:00';
    const freq = (a.frequency || '').toLowerCase();
    const weekday = a.scheduleWeekday ?? a.schedule_weekday ?? 0;
    const monthday = a.scheduleMonthday ?? a.schedule_monthday ?? 1;

    if (freq === 'daily') return `Daily at ${time}`;
    if (freq === 'weekly') return `Weekly on ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][weekday % 7]} at ${time}`;
    if (freq === 'monthly') return `Monthly on the ${monthday}${ordinalSuffix(monthday)} at ${time}`;
    if (freq === 'off') return 'Disabled';
    return a.frequency;
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Automations', headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#B8F25C" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Feather name="alert-circle" size={48} color="#F25C5C" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : automations.length === 0 ? (
          <View style={styles.center}>
            <Feather name="zap" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No automations configured</Text>
          </View>
        ) : (
          automations.map((automation) => {
            const rawType = automation.automationType || automation.automation_type || '';
            const info = AUTOMATION_INFO[rawType] || {
              title: rawType.replace(/_/g, ' ').toUpperCase(),
              description: '',
              icon: 'settings' as const,
              color: '#888',
            };
            const isRunning = running === rawType;

            return (
              <View key={automation.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: info.color + '20' }]}>
                    <Feather name={info.icon} size={20} color={info.color} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{info.title}</Text>
                    <Text style={styles.cardDesc}>{info.description}</Text>
                    <Text style={styles.schedule}>{formatSchedule(automation)}</Text>
                  </View>
                  <Switch
                    value={automation.enabled}
                    onValueChange={() => toggleAutomation(automation)}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(184,242,92,0.4)' }}
                    thumbColor={automation.enabled ? '#B8F25C' : '#666'}
                    disabled={toggling === automation.id}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.runNowButton, isRunning && { opacity: 0.6 }]}
                  onPress={() => handleRunNow(rawType)}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <ActivityIndicator size="small" color="#B8F25C" />
                  ) : (
                    <>
                      <Feather name="play" size={14} color="#B8F25C" />
                      <Text style={styles.runNowText}>Run Now</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </>
  );
}

function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1C16' },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  errorText: { color: '#F25C5C', fontSize: 14, marginTop: 12, textAlign: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 15, marginTop: 12 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(200,92,242,0.1)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  iconCircle: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  cardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 16 },
  schedule: { fontSize: 12, color: 'rgba(184,242,92,0.7)', marginTop: 6, fontWeight: '600' },
  runNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(184,242,92,0.2)',
    backgroundColor: 'rgba(184,242,92,0.06)',
  },
  runNowText: { fontSize: 13, fontWeight: '600', color: '#B8F25C' },
});
