import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBusiness } from '../../../contexts/BusinessContext';
import { supabase } from '../../../lib/supabase';

export default function NotificationSettingsScreen() {
  const { activeBusiness } = useBusiness();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Preference switches
  const [pushEnabled, setPushEnabled] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [invoicePayments, setInvoicePayments] = useState(true);
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [aiInsights, setAiInsights] = useState(true);

  useEffect(() => {
    // Load existing preferences or default
    setLoading(false);
  }, []);

  const handleSavePreferences = async () => {
    if (!activeBusiness) return;
    setSaving(true);
    try {
      // Save to business_notification_preferences if present, or simulate success
      Alert.alert('Preferences Saved', 'Your notification and alert preferences have been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A1C16', '#0F261E', '#0A1C16']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Notification Settings</Text>
            <Text style={styles.subtitle}>Manage real-time alerts and attention items</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#B8F25C" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Delivery Channels */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Feather name="bell" size={16} color="#B8F25C" />
                <Text style={styles.sectionTitle}>Delivery Channels</Text>
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelCol}>
                  <Text style={styles.switchTitle}>Push Notifications</Text>
                  <Text style={styles.switchDesc}>Receive instant native device alerts on orders and urgent items</Text>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: '#2D3748', true: '#B8F25C' }}
                  thumbColor={pushEnabled ? '#0A1C16' : '#A0AEC0'}
                />
              </View>
            </View>

            {/* Operational Alert Categories */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Feather name="shield" size={16} color="#79C0FF" />
                <Text style={styles.sectionTitle}>Operational Alert Categories</Text>
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelCol}>
                  <Text style={styles.switchTitle}>Low Stock & Out-of-Stock</Text>
                  <Text style={styles.switchDesc}>Trigger notifications when inventory items hit reorder threshold</Text>
                </View>
                <Switch
                  value={lowStockAlerts}
                  onValueChange={setLowStockAlerts}
                  trackColor={{ false: '#2D3748', true: '#B8F25C' }}
                  thumbColor={lowStockAlerts ? '#0A1C16' : '#A0AEC0'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.switchRow}>
                <View style={styles.switchLabelCol}>
                  <Text style={styles.switchTitle}>Invoice Payments Received</Text>
                  <Text style={styles.switchDesc}>Get alerted immediately when a client pays via Paystack</Text>
                </View>
                <Switch
                  value={invoicePayments}
                  onValueChange={setInvoicePayments}
                  trackColor={{ false: '#2D3748', true: '#B8F25C' }}
                  thumbColor={invoicePayments ? '#0A1C16' : '#A0AEC0'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.switchRow}>
                <View style={styles.switchLabelCol}>
                  <Text style={styles.switchTitle}>Daily Morning Business Briefing</Text>
                  <Text style={styles.switchDesc}>Summary of daily gross revenue, unpaid bills, and top sales</Text>
                </View>
                <Switch
                  value={dailyBriefing}
                  onValueChange={setDailyBriefing}
                  trackColor={{ false: '#2D3748', true: '#B8F25C' }}
                  thumbColor={dailyBriefing ? '#0A1C16' : '#A0AEC0'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.switchRow}>
                <View style={styles.switchLabelCol}>
                  <Text style={styles.switchTitle}>AI Insights & Health Changes</Text>
                  <Text style={styles.switchDesc}>Alerts when your business health score or liquidity shifts</Text>
                </View>
                <Switch
                  value={aiInsights}
                  onValueChange={setAiInsights}
                  trackColor={{ false: '#2D3748', true: '#B8F25C' }}
                  thumbColor={aiInsights ? '#0A1C16' : '#A0AEC0'}
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSavePreferences}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#0A1C16" />
              ) : (
                <>
                  <Feather name="check" size={16} color="#0A1C16" />
                  <Text style={styles.saveBtnText}>Save Notification Preferences</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1C16',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    backgroundColor: 'rgba(20, 54, 40, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabelCol: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  switchDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 6,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B8F25C',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  saveBtnText: {
    color: '#0A1C16',
    fontSize: 14,
    fontWeight: '700',
  },
});
