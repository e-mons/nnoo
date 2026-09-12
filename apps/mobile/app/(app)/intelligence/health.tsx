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
import { useBusiness } from '../../../contexts/BusinessContext';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';

type HealthSnapshot = {
  id: string;
  score: number | null;
  score_band: string | null;
  data_coverage: string;
  dimension_results: Record<string, { score: number; band: string; label: string }>;
  status: string;
  as_of_timestamp: string;
  ai_explanation: { text: string } | null;
};

const BAND_COLORS: Record<string, string> = {
  EXCELLENT: '#B8F25C',
  GOOD: '#5CF2B8',
  FAIR: '#F2C85C',
  POOR: '#F29B5C',
  CRITICAL: '#F25C5C',
};

export default function BusinessHealthScreen() {
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [explaining, setExplaining] = useState(false);

  const fetchLatestSnapshot = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      setError(null);
      const { data, error: queryError } = await supabase
        .from('ai_business_health_snapshots')
        .select('*')
        .eq('business_id', activeBusiness.id)
        .eq('status', 'COMPLETED')
        .order('as_of_timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (queryError) throw queryError;
      setSnapshot(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load health score');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchLatestSnapshot();
  }, [fetchLatestSnapshot]);

  const handleRefreshScore = async () => {
    if (!activeBusiness || !user || generating) return;
    setGenerating(true);
    try {
      await api.post('/api/v1/ai/health/refresh', {
        businessId: activeBusiness.id,
      });
      await fetchLatestSnapshot();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate health score');
    } finally {
      setGenerating(false);
    }
  };

  const handleExplainScore = async () => {
    if (!activeBusiness || !user || !snapshot || explaining) return;
    setExplaining(true);
    try {
      await api.post('/api/v1/ai/health/explain', {
        businessId: activeBusiness.id,
        snapshotId: snapshot.id,
      });
      await fetchLatestSnapshot();
    } catch (err: unknown) {
      Alert.alert('AI Explanation', err instanceof Error ? err.message : 'Failed to generate explanation');
    } finally {
      setExplaining(false);
    }
  };

  const bandColor = snapshot?.score_band ? (BAND_COLORS[snapshot.score_band] || '#888') : '#888';

  return (
    <>
      <Stack.Screen options={{ title: 'Business Health', headerShown: true }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLatestSnapshot(); }} tintColor="#B8F25C" />}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#B8F25C" />
          </View>
        ) : error && !snapshot ? (
          <View style={styles.center}>
            <Feather name="alert-circle" size={48} color="#F25C5C" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchLatestSnapshot}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !snapshot ? (
          <View style={styles.center}>
            <Feather name="heart" size={64} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No health score yet</Text>
            <TouchableOpacity style={styles.generateButton} onPress={handleRefreshScore} disabled={generating}>
              {generating ? <ActivityIndicator size="small" color="#0A1C16" /> : <Text style={styles.generateText}>Generate Health Score</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Score Gauge */}
            <View style={styles.scoreSection}>
              <Text style={[styles.scoreValue, { color: bandColor }]}>
                {snapshot.score !== null ? snapshot.score : '—'}
              </Text>
              <Text style={[styles.scoreBand, { color: bandColor }]}>{snapshot.score_band || 'N/A'}</Text>
              <Text style={styles.scoreDate}>As of {new Date(snapshot.as_of_timestamp).toLocaleDateString()}</Text>
            </View>

            {/* Dimension Cards */}
            {snapshot.dimension_results && Object.entries(snapshot.dimension_results).map(([key, dim]) => {
              const dimData = dim as { score: number; band: string; label: string };
              const dimColor = BAND_COLORS[dimData.band] || '#888';
              return (
                <View key={key} style={styles.dimCard}>
                  <View style={styles.dimHeader}>
                    <Text style={styles.dimLabel}>{dimData.label || key}</Text>
                    <Text style={[styles.dimBand, { color: dimColor }]}>{dimData.band}</Text>
                  </View>
                  <View style={styles.dimBar}>
                    <View style={[styles.dimFill, { width: `${dimData.score}%`, backgroundColor: dimColor }]} />
                  </View>
                  <Text style={styles.dimScore}>{dimData.score}/100</Text>
                </View>
              );
            })}

            {/* AI Explanation */}
            {snapshot.ai_explanation?.text ? (
              <View style={styles.explanationCard}>
                <View style={styles.aiHeader}>
                  <Feather name="cpu" size={14} color="#B8F25C" />
                  <Text style={styles.aiLabel}>AI Health Diagnostic</Text>
                </View>
                <Text style={styles.explanationText}>{snapshot.ai_explanation.text}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.explainButton}
                onPress={handleExplainScore}
                disabled={explaining}
                activeOpacity={0.8}
              >
                {explaining ? (
                  <ActivityIndicator size="small" color="#B8F25C" />
                ) : (
                  <>
                    <Feather name="cpu" size={16} color="#B8F25C" />
                    <Text style={styles.explainText}>Generate AI Explanation</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Refresh Button */}
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshScore} disabled={generating}>
              {generating ? (
                <ActivityIndicator size="small" color="#0A1C16" />
              ) : (
                <>
                  <Feather name="refresh-cw" size={16} color="#0A1C16" />
                  <Text style={styles.refreshText}>Recalculate Score</Text>
                </>
              )}
            </TouchableOpacity>
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
  errorText: { color: '#F25C5C', fontSize: 14, marginTop: 12, textAlign: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 15, marginTop: 16 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#B8F25C', borderRadius: 12 },
  retryText: { color: '#0A1C16', fontWeight: '700', fontSize: 14 },
  generateButton: { marginTop: 20, paddingHorizontal: 28, paddingVertical: 14, backgroundColor: '#B8F25C', borderRadius: 14 },
  generateText: { fontSize: 15, fontWeight: '700', color: '#0A1C16' },
  scoreSection: { alignItems: 'center', paddingVertical: 32, marginBottom: 24 },
  scoreValue: { fontSize: 72, fontWeight: '900' },
  scoreBand: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  scoreDate: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 },
  dimCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 10 },
  dimHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dimLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  dimBand: { fontSize: 12, fontWeight: '700' },
  dimBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 6 },
  dimFill: { height: 6, borderRadius: 3 },
  dimScore: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'right' },
  explanationCard: { backgroundColor: 'rgba(184,242,92,0.06)', borderRadius: 16, padding: 20, marginTop: 20, borderWidth: 1, borderColor: 'rgba(184,242,92,0.12)' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  aiLabel: { fontSize: 13, fontWeight: '700', color: '#B8F25C' },
  explanationText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },
  explainButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, paddingVertical: 12, backgroundColor: 'rgba(184,242,92,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(184,242,92,0.2)' },
  explainText: { fontSize: 14, fontWeight: '700', color: '#B8F25C' },
  refreshButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24, paddingVertical: 14, backgroundColor: '#B8F25C', borderRadius: 14 },
  refreshText: { fontSize: 15, fontWeight: '700', color: '#0A1C16' },
});
