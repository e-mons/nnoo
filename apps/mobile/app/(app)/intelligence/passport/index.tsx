import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { useAuth } from '../../../../context/AuthContext';
import { api } from '../../../../lib/api';
import { supabase } from '../../../../lib/supabase';
import * as Linking from 'expo-linking';

type DimensionItem = {
  dimensionKey: string;
  title: string;
  score: number;
  status: string;
  benchmarkDescription?: string;
};

type CreditPassport = {
  id: string;
  passport_code: string;
  status: string;
  score: number | null;
  score_band: string | null;
  as_of_timestamp: string;
  data_coverage: string;
  dimensions: DimensionItem[];
  created_at: string;
};

export default function CreditPassportScreen() {
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const [passport, setPassport] = useState<CreditPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://nnoo.app';

  const fetchPassport = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      setError(null);
      const { data, error: queryError } = await supabase
        .from('credit_passport_snapshots')
        .select('*')
        .eq('business_id', activeBusiness.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (queryError) throw queryError;

      if (data) {
        const payload = (data.snapshot_payload as any) || {};
        const score = payload.score ?? payload.compositeScore ?? null;
        const scoreBand = payload.scoreBand ?? (score >= 750 ? 'EXCELLENT' : score >= 650 ? 'GOOD' : score >= 500 ? 'FAIR' : 'NEEDS_ATTENTION');
        const dimensions = Array.isArray(payload.dimensions) ? payload.dimensions : [];

        setPassport({
          id: data.id,
          passport_code: data.passport_code || `CP-${data.id.substring(0, 8).toUpperCase()}`,
          status: data.status,
          score,
          score_band: scoreBand,
          as_of_timestamp: data.as_of_timestamp || data.created_at,
          data_coverage: data.data_coverage || 'high',
          dimensions,
          created_at: data.created_at,
        });
      } else {
        setPassport(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load credit passport');
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchPassport();
  }, [fetchPassport]);

  const handleGenerate = async () => {
    if (!activeBusiness || !user || generating) return;
    setGenerating(true);
    try {
      await api.post(`/api/v1/ai/credit-passport/generate?businessId=${activeBusiness.id}`, {});
      await fetchPassport();
      Alert.alert('Generated', 'Verified Credit Passport snapshot has been created.');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to generate credit passport');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!passport?.id || !activeBusiness || sharing) return;
    setSharing(true);
    try {
      const res = await api.post<{
        success: boolean;
        data?: {
          shareUrl: string;
          shareToken: string;
        };
      }>(`/api/v1/ai/credit-passport/shares?businessId=${activeBusiness.id}`, {
        snapshotId: passport.id,
        recipientName: 'Verified Financial Partner',
        accessScope: 'summary_only',
      });

      const shareUrl = res.data?.shareUrl || `${baseUrl}/passport/share/${passport.id}`;
      await Share.share({
        message: `View ${activeBusiness.name}'s verified NNOO Credit Passport: ${shareUrl}`,
        url: shareUrl,
        title: `${activeBusiness.name} Credit Passport`,
      });
    } catch (err: unknown) {
      Alert.alert('Share Error', err instanceof Error ? err.message : 'Failed to generate share link');
    } finally {
      setSharing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!passport?.id || !activeBusiness) return;
    try {
      const pdfUrl = `${baseUrl}/api/v1/ai/credit-passport/snapshots/${passport.id}/pdf?businessId=${activeBusiness.id}`;
      await Linking.openURL(pdfUrl);
    } catch (err: any) {
      Alert.alert('PDF Export', err.message || 'Unable to open Credit Passport PDF.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Credit Passport', headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#B8F25C" />
          </View>
        ) : error && !passport ? (
          <View style={styles.center}>
            <Feather name="alert-triangle" size={32} color="#F25C5C" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.generateButton} onPress={fetchPassport}>
              <Text style={styles.generateText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !passport ? (
          <View style={styles.center}>
            <Feather name="award" size={56} color="rgba(242, 200, 92, 0.4)" />
            <Text style={styles.emptyTitle}>No Credit Passport</Text>
            <Text style={styles.emptyText}>Generate a verified credit passport for your business.</Text>
            <TouchableOpacity style={styles.generateButton} onPress={handleGenerate} disabled={generating}>
              {generating ? <ActivityIndicator size="small" color="#0A1C16" /> : <Text style={styles.generateText}>Generate Passport</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Passport Card */}
            <View style={styles.passportCard}>
              <View style={styles.passportHeader}>
                <Feather name="shield" size={24} color="#F2C85C" />
                <Text style={styles.passportTitle}>NNOO CREDIT PASSPORT</Text>
              </View>
              <Text style={styles.passportCode}>{passport.passport_code}</Text>
              <Text style={styles.passportScore}>{passport.score ?? '—'}</Text>
              {passport.score_band && <Text style={styles.passportBand}>{passport.score_band}</Text>}
              <Text style={styles.passportValidity}>
                As of: {new Date(passport.as_of_timestamp).toLocaleDateString()} • Coverage: {passport.data_coverage.toUpperCase()}
              </Text>
            </View>

            {/* Dimension Breakdown */}
            {passport.dimensions.length > 0 && (
              <View style={styles.dimensionsSection}>
                <Text style={styles.sectionTitle}>Dimension Breakdown</Text>
                {passport.dimensions.map((dim, idx) => (
                  <View key={idx} style={styles.dimCard}>
                    <View style={styles.dimHeader}>
                      <Text style={styles.dimTitle}>{dim.title}</Text>
                      <Text style={styles.dimScore}>{dim.score}/100</Text>
                    </View>
                    {dim.benchmarkDescription ? (
                      <Text style={styles.dimDesc}>{dim.benchmarkDescription}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.pdfButton} onPress={handleDownloadPdf} activeOpacity={0.8}>
                <Feather name="download" size={18} color="#FFFFFF" />
                <Text style={styles.pdfText}>Download Official PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
                disabled={sharing}
                activeOpacity={0.8}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color="#0A1C16" />
                ) : (
                  <>
                    <Feather name="share-2" size={18} color="#0A1C16" />
                    <Text style={styles.shareText}>Share Verification Link</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={handleGenerate}
                disabled={generating}
                activeOpacity={0.8}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#B8F25C" />
                ) : (
                  <>
                    <Feather name="refresh-cw" size={16} color="#B8F25C" />
                    <Text style={styles.regenerateText}>Generate New Version</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1C16' },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  errorText: { color: '#F25C5C', fontSize: 14, marginTop: 12, textAlign: 'center' },
  emptyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4, textAlign: 'center' },
  generateButton: { marginTop: 24, paddingHorizontal: 28, paddingVertical: 14, backgroundColor: '#B8F25C', borderRadius: 14 },
  generateText: { fontSize: 15, fontWeight: '700', color: '#0A1C16' },
  passportCard: {
    backgroundColor: 'rgba(242,200,92,0.06)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(242,200,92,0.25)',
    marginBottom: 20,
  },
  passportHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  passportTitle: { fontSize: 16, fontWeight: '800', color: '#F2C85C', letterSpacing: 1 },
  passportCode: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  passportScore: { fontSize: 64, fontWeight: '900', color: '#FFFFFF' },
  passportBand: { fontSize: 18, fontWeight: '700', color: '#F2C85C', marginTop: 2 },
  passportValidity: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 12 },
  dimensionsSection: { marginBottom: 20, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  dimCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dimHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dimTitle: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  dimScore: { fontSize: 14, fontWeight: '800', color: '#B8F25C' },
  dimDesc: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  actions: { gap: 12 },
  pdfButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#143628', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  pdfText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  shareButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#B8F25C', borderRadius: 14 },
  shareText: { fontSize: 15, fontWeight: '700', color: '#0A1C16' },
  regenerateButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(184,242,92,0.3)', backgroundColor: 'rgba(184,242,92,0.06)' },
  regenerateText: { fontSize: 15, fontWeight: '700', color: '#B8F25C' },
});
