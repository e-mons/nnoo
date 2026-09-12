import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useBusiness } from '../../../contexts/BusinessContext';
import { supabase } from '../../../lib/supabase';
import { api } from '../../../lib/api';

type SummaryPeriod = 'this_month' | 'last_7_days' | 'last_month';

type Summary = {
  id: string;
  summary_type: string;
  headline: string;
  overview: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
  verified_fact_snapshot?: Record<string, any>;
};

export default function SmartInsightsScreen() {
  const { activeBusiness } = useBusiness();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<SummaryPeriod>('this_month');
  const [error, setError] = useState<string | null>(null);

  const fetchSummaries = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      setError(null);
      // Try API route first for parity
      try {
        const res = await api.get<Summary[]>(
          `/api/v1/ai/insights/summaries?businessId=${activeBusiness.id}&limit=10`
        );
        if (Array.isArray(res) && res.length > 0) {
          setSummaries(res);
          return;
        }
      } catch {
        // Fallback to direct supabase query
      }

      const { data, error: queryError } = await supabase
        .from('ai_business_summaries')
        .select('id, summary_type, headline, overview, period_start, period_end, status, created_at, verified_fact_snapshot')
        .eq('business_id', activeBusiness.id)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false })
        .limit(10);

      if (queryError) throw queryError;
      setSummaries(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  const handleGenerateSummary = async () => {
    if (!activeBusiness || generating) return;
    setGenerating(true);
    try {
      const idempotencyKey = `summary_${activeBusiness.id}_${selectedPeriod}_${Crypto.randomUUID()}`;
      await api.post(`/api/v1/ai/insights/generate?businessId=${activeBusiness.id}`, {
        businessId: activeBusiness.id,
        summaryType: selectedPeriod,
        idempotencyKey,
      });

      Alert.alert('Success', 'AI Business Summary generated successfully.');
      await fetchSummaries();
    } catch (err: unknown) {
      Alert.alert(
        'Generation Failed',
        err instanceof Error ? err.message : 'Failed to generate summary narrative.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const periodLabels: Record<SummaryPeriod, string> = {
    this_month: 'This Month',
    last_7_days: 'Last 7 Days',
    last_month: 'Last Month',
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Smart Insights', headerShown: true }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchSummaries();
            }}
            tintColor="#B8F25C"
          />
        }
      >
        {/* Generator Controls */}
        <View style={styles.controlCard}>
          <Text style={styles.controlTitle}>Generate Fresh Narrative</Text>
          <Text style={styles.controlSubtitle}>
            Select a period to analyze verified business transactions and metrics.
          </Text>

          <View style={styles.periodRow}>
            {(['this_month', 'last_7_days', 'last_month'] as SummaryPeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodTab,
                  selectedPeriod === period && styles.periodTabActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    selectedPeriod === period && styles.periodTabTextActive,
                  ]}
                >
                  {periodLabels[period]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.generateButton, generating && { opacity: 0.6 }]}
            onPress={handleGenerateSummary}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#0A1C16" />
            ) : (
              <>
                <Feather name="zap" size={16} color="#0A1C16" />
                <Text style={styles.generateButtonText}>Generate AI Summary</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#B8F25C" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Feather name="alert-circle" size={48} color="#F25C5C" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchSummaries}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : summaries.length === 0 ? (
          <View style={styles.center}>
            <Feather name="bar-chart-2" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No insights generated yet</Text>
            <Text style={styles.emptySubtext}>
              Tap &quot;Generate AI Summary&quot; above to create your first analytical briefing
            </Text>
          </View>
        ) : (
          summaries.map((summary) => (
            <View key={summary.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{summary.summary_type.replace(/_/g, ' ').toUpperCase()}</Text>
                </View>
                <Text style={styles.cardDate}>
                  {summary.period_start ? new Date(summary.period_start).toLocaleDateString() : ''} — {summary.period_end ? new Date(summary.period_end).toLocaleDateString() : ''}
                </Text>
              </View>
              <Text style={styles.headline}>{summary.headline}</Text>
              <Text style={styles.overview}>{summary.overview}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1C16' },
  content: { padding: 16, paddingBottom: 48 },
  controlCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(184,242,92,0.2)',
  },
  controlTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  controlSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12, lineHeight: 18 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  periodTabActive: {
    backgroundColor: 'rgba(184,242,92,0.15)',
    borderColor: '#B8F25C',
  },
  periodTabText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  periodTabTextActive: { color: '#B8F25C' },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B8F25C',
    paddingVertical: 12,
    borderRadius: 12,
  },
  generateButtonText: { color: '#0A1C16', fontSize: 14, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  errorText: { color: '#F25C5C', fontSize: 14, marginTop: 12, textAlign: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 15, marginTop: 12 },
  emptySubtext: { color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 4, textAlign: 'center' },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#B8F25C', borderRadius: 12 },
  retryText: { color: '#0A1C16', fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(92, 242, 184, 0.1)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { backgroundColor: 'rgba(92,242,184,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 11, fontWeight: '700', color: '#5CF2B8' },
  cardDate: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  headline: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  overview: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
});
