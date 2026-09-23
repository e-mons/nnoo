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
  Share,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBusiness } from '../../../contexts/BusinessContext';
import { api } from '../../../lib/api';

type WhatsAppStatus = {
  isConnected: boolean;
  maskedPhone: string | null;
  status: string;
};

interface CommandTip {
  cmd: string;
  desc: string;
  icon: keyof typeof Feather.glyphMap;
}

const COMMAND_TIPS: CommandTip[] = [
  { cmd: 'summary', desc: "Today's sales, revenue & net profit", icon: 'pie-chart' },
  { cmd: 'low stock', desc: 'Critical items below reorder threshold', icon: 'alert-triangle' },
  { cmd: 'health', desc: 'Financial health score & cash flow pulse', icon: 'activity' },
  { cmd: 'help', desc: 'Full interactive command cheatsheet', icon: 'help-circle' },
];

export default function WhatsAppSettingsScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [linkingCode, setLinkingCode] = useState<string | null>(null);
  const [clickToChatUrl, setClickToChatUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!activeBusiness) return;
    try {
      const data = await api.get<WhatsAppStatus>('/api/v1/ai/whatsapp/status', {
        businessId: activeBusiness.id,
      });
      setStatus(data);
    } catch (err: unknown) {
      console.warn('[WhatsAppSettings] Failed to fetch WhatsApp status:', err);
      setStatus({ isConnected: false, maskedPhone: null, status: 'NOT_CONNECTED' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
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
      Alert.alert('Linking Error', err instanceof Error ? err.message : 'Failed to generate linking code. Please check your connection.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!activeBusiness || sendingTest) return;
    setSendingTest(true);
    try {
      await api.post('/api/v1/ai/whatsapp/test-message', {
        businessId: activeBusiness.id,
      });
      Alert.alert(
        'Test Message Dispatched',
        `A verified notification was sent to ${status?.maskedPhone || 'your registered number'}. Check your WhatsApp!`
      );
    } catch (err: unknown) {
      Alert.alert('Test Failed', err instanceof Error ? err.message : 'Could not send test alert.');
    } finally {
      setSendingTest(false);
    }
  };

  const handleShareCode = async () => {
    if (!linkingCode) return;
    try {
      await Share.share({
        message: `NNOO WhatsApp Linking Code: ${linkingCode}. Send this code to NNOO on WhatsApp to connect your account.`,
      });
    } catch (err: unknown) {
      console.debug('[WhatsAppSettings] Share action was cancelled or failed:', err);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect WhatsApp',
      'Are you sure? You will stop receiving real-time business alerts, low stock warnings, and daily summaries via WhatsApp.',
      [
        { text: 'Keep Connected', style: 'cancel' },
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
              setClickToChatUrl(null);
              Alert.alert('Disconnected', 'WhatsApp integration has been unlinked.');
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to disconnect');
            }
          },
        },
      ]
    );
  };

  const openWhatsApp = (customUrl?: string) => {
    const target = customUrl || clickToChatUrl;
    if (target) {
      Linking.openURL(target).catch(() => {
        Linking.openURL('https://wa.me/');
      });
    } else {
      Linking.openURL('whatsapp://send?text=').catch(() => {
        Linking.openURL('https://wa.me/');
      });
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A1C16', '#0F261E', '#0A1C16']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.75}>
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.tag}>
              <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
              <Text style={styles.tagText}>WhatsApp Assistant</Text>
            </View>
          </View>
          <Text style={styles.title}>WhatsApp Assistant</Text>
          <Text style={styles.subtitle}>Instant business alerts, AI bookkeeping & customer receipts</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
        >
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#25D366" />
              <Text style={styles.loadingText}>Syncing WhatsApp connection state...</Text>
            </View>
          ) : status?.isConnected ? (
            <>
              {/* CONNECTED STATE CARD */}
              <View style={styles.activeConnectionCard}>
                <View style={styles.activeCardHeader}>
                  <View style={styles.whatsappIconCircle}>
                    <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.statusPill}>
                      <View style={styles.pulsingDot} />
                      <Text style={styles.statusPillText}>Active & Connected</Text>
                    </View>
                    <Text style={styles.activePhoneText}>{status.maskedPhone || 'Registered WhatsApp Number'}</Text>
                  </View>
                </View>

                <View style={styles.connectionDivider} />

                <View style={styles.activeMetaRow}>
                  <View style={styles.activeMetaItem}>
                    <Text style={styles.activeMetaLabel}>Workspace</Text>
                    <Text style={styles.activeMetaValue} numberOfLines={1}>
                      {activeBusiness?.name || 'Current Business'}
                    </Text>
                  </View>
                  <View style={styles.activeMetaDivider} />
                  <View style={styles.activeMetaItem}>
                    <Text style={styles.activeMetaLabel}>Delivery Mode</Text>
                    <Text style={[styles.activeMetaValue, { color: '#B8F25C' }]}>Instant AI Push</Text>
                  </View>
                </View>

                {/* Primary Connected Actions */}
                <View style={styles.connectedActionGrid}>
                  <TouchableOpacity
                    style={styles.openChatBtn}
                    onPress={() => openWhatsApp()}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#0A1C16" />
                    <Text style={styles.openChatBtnText}>Open WhatsApp Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.testMsgBtn, sendingTest && { opacity: 0.6 }]}
                    onPress={handleSendTestMessage}
                    disabled={sendingTest}
                    activeOpacity={0.8}
                  >
                    {sendingTest ? (
                      <ActivityIndicator size="small" color="#B8F25C" />
                    ) : (
                      <>
                        <Feather name="send" size={15} color="#B8F25C" />
                        <Text style={styles.testMsgBtnText}>Send Test Alert</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Active Alerts List */}
              <View style={styles.sectionHeaderRow}>
                <Feather name="bell" size={15} color="#B8F25C" />
                <Text style={styles.sectionTitle}>Automated WhatsApp Alerts</Text>
              </View>

              <View style={styles.featuresCard}>
                <View style={styles.alertFeatureRow}>
                  <View style={[styles.featureIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Feather name="alert-triangle" size={16} color="#FF7B72" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>Low Stock & Reorder Urgencies</Text>
                    <Text style={styles.featureDesc}>Get notified immediately when inventory dips below minimum</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color="#B8F25C" />
                </View>

                <View style={styles.featureSeparator} />

                <View style={styles.alertFeatureRow}>
                  <View style={[styles.featureIconBox, { backgroundColor: 'rgba(184, 242, 92, 0.15)' }]}>
                    <Feather name="check-circle" size={16} color="#B8F25C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>AI Bookkeeper Confirmations</Text>
                    <Text style={styles.featureDesc}>Approve classified expenses & sales directly with a quick reply</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color="#B8F25C" />
                </View>

                <View style={styles.featureSeparator} />

                <View style={styles.alertFeatureRow}>
                  <View style={[styles.featureIconBox, { backgroundColor: 'rgba(121, 192, 255, 0.15)' }]}>
                    <Feather name="file-text" size={16} color="#79C0FF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>Overdue Invoice Reminders</Text>
                    <Text style={styles.featureDesc}>Alerts on unpaid customer bills to protect your cash flow</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color="#B8F25C" />
                </View>
              </View>

              {/* Danger Zone Disconnect */}
              <TouchableOpacity
                style={styles.disconnectContainer}
                onPress={handleDisconnect}
                activeOpacity={0.75}
              >
                <Feather name="slash" size={16} color="#FF7B72" />
                <Text style={styles.disconnectText}>Disconnect WhatsApp from {activeBusiness?.name}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* DISCONNECTED STATE HERO */}
              <View style={styles.heroCard}>
                <View style={styles.heroGlowCircle}>
                  <Ionicons name="logo-whatsapp" size={42} color="#25D366" />
                </View>
                <Text style={styles.heroTitle}>Manage Business from WhatsApp</Text>
                <Text style={styles.heroSubtitle}>
                  Connect your personal or business WhatsApp to receive instant financial alerts, approve AI transactions, and query live profit anytime.
                </Text>

                {/* 3 Step Guide */}
                <View style={styles.stepsCard}>
                  <View style={styles.stepItem}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>Generate Security Code</Text>
                      <Text style={styles.stepDesc}>Tap below to create a single-use 6-character linking token.</Text>
                    </View>
                  </View>

                  <View style={styles.stepConnector} />

                  <View style={styles.stepItem}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>Send Code to NNOO Bot</Text>
                      <Text style={styles.stepDesc}>Tap &quot;Send to WhatsApp&quot; to forward the code to our official bot.</Text>
                    </View>
                  </View>

                  <View style={styles.stepConnector} />

                  <View style={styles.stepItem}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>Instantly Authenticated</Text>
                      <Text style={styles.stepDesc}>Your WhatsApp number is securely bound to this business workspace.</Text>
                    </View>
                  </View>
                </View>

                {/* Linking Code View or Generate Button */}
                {linkingCode ? (
                  <View style={styles.codeContainer}>
                    <Text style={styles.codeNoticeLabel}>YOUR VERIFICATION CODE</Text>
                    <View style={styles.codeDigitsRow}>
                      <Text style={styles.codeDigitsText}>{linkingCode}</Text>
                    </View>
                    <View style={styles.codeTimerBadge}>
                      <Feather name="clock" size={12} color="#F59E0B" />
                      <Text style={styles.codeTimerText}>Valid for 10 minutes</Text>
                    </View>

                    {/* Quick WhatsApp Link Action */}
                    {clickToChatUrl ? (
                      <TouchableOpacity
                        style={styles.openWhatsAppSendBtn}
                        onPress={() => openWhatsApp(clickToChatUrl)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="logo-whatsapp" size={19} color="#0A1C16" />
                        <Text style={styles.openWhatsAppSendBtnText}>Open WhatsApp & Send Code</Text>
                      </TouchableOpacity>
                    ) : null}

                    <View style={styles.codeAuxRow}>
                      <TouchableOpacity style={styles.auxBtn} onPress={handleShareCode} activeOpacity={0.7}>
                        <Feather name="share-2" size={14} color="#FFFFFF" />
                        <Text style={styles.auxBtnText}>Share Code</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.auxBtn}
                        onPress={generateLinkingCode}
                        disabled={generating}
                        activeOpacity={0.7}
                      >
                        <Feather name="refresh-cw" size={14} color="#B8F25C" />
                        <Text style={[styles.auxBtnText, { color: '#B8F25C' }]}>Regenerate</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.generatePrimaryBtn, generating && { opacity: 0.7 }]}
                    onPress={generateLinkingCode}
                    disabled={generating}
                    activeOpacity={0.8}
                  >
                    {generating ? (
                      <ActivityIndicator size="small" color="#0A1C16" />
                    ) : (
                      <>
                        <Feather name="link-2" size={18} color="#0A1C16" />
                        <Text style={styles.generatePrimaryBtnText}>Generate 6-Digit Linking Code</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* Interactive Commands Preview */}
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="chat-question" size={16} color="#79C0FF" />
            <Text style={styles.sectionTitle}>What You Can Text NNOO</Text>
          </View>

          <View style={styles.commandsCard}>
            {COMMAND_TIPS.map((tip, index) => {
              const isLast = index === COMMAND_TIPS.length - 1;
              return (
                <View key={tip.cmd} style={[styles.commandRow, isLast && { borderBottomWidth: 0 }]}>
                  <View style={styles.commandPill}>
                    <Feather name={tip.icon} size={13} color="#25D366" />
                    <Text style={styles.commandPillText}>&quot;{tip.cmd}&quot;</Text>
                  </View>
                  <Text style={styles.commandDescText}>{tip.desc}</Text>
                </View>
              );
            })}
          </View>

          {/* Security Guarantee Note */}
          <View style={styles.securityFooter}>
            <Feather name="shield" size={14} color="rgba(255,255,255,0.45)" />
            <Text style={styles.securityFooterText}>
              End-to-end encrypted messaging. Only authorized business members can trigger AI actions.
            </Text>
          </View>
        </ScrollView>
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
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    color: '#25D366',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.58)',
    marginTop: 3,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 48,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },

  /* ACTIVE CONNECTED STATE */
  activeConnectionCard: {
    backgroundColor: 'rgba(20, 54, 40, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.3)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  whatsappIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.35)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37, 211, 102, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#25D366',
  },
  statusPillText: {
    color: '#25D366',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  activePhoneText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  connectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 14,
  },
  activeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  activeMetaItem: {
    flex: 1,
  },
  activeMetaDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
  activeMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  activeMetaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  connectedActionGrid: {
    gap: 10,
  },
  openChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 13,
  },
  openChatBtnText: {
    color: '#0A1C16',
    fontSize: 14,
    fontWeight: '800',
  },
  testMsgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(184, 242, 92, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.3)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  testMsgBtnText: {
    color: '#B8F25C',
    fontSize: 13,
    fontWeight: '700',
  },
  disconnectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 18,
  },
  disconnectText: {
    color: '#FF7B72',
    fontSize: 13,
    fontWeight: '700',
  },

  /* DISCONNECTED HERO */
  heroCard: {
    backgroundColor: 'rgba(20, 54, 40, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroGlowCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(37, 211, 102, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(37, 211, 102, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 18,
  },

  /* STEPS */
  stepsCard: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 211, 102, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#25D366',
    fontSize: 12,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  stepConnector: {
    width: 1.5,
    height: 12,
    backgroundColor: 'rgba(37, 211, 102, 0.25)',
    marginLeft: 11,
    marginVertical: 4,
  },

  /* LINKING CODE CONTAINER */
  codeContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.3)',
  },
  codeNoticeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  codeDigitsRow: {
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.25)',
  },
  codeDigitsText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#25D366',
    letterSpacing: 8,
  },
  codeTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
  },
  codeTimerText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },
  openWhatsAppSendBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  openWhatsAppSendBtnText: {
    color: '#0A1C16',
    fontSize: 14,
    fontWeight: '800',
  },
  codeAuxRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  auxBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  auxBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  generatePrimaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B8F25C',
    borderRadius: 14,
    paddingVertical: 14,
  },
  generatePrimaryBtnText: {
    color: '#0A1C16',
    fontSize: 14,
    fontWeight: '800',
  },

  /* SECTION TITLE */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* FEATURES CARD */
  featuresCard: {
    backgroundColor: 'rgba(20, 54, 40, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  alertFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 15,
  },
  featureSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },

  /* COMMANDS CARD */
  commandsCard: {
    backgroundColor: 'rgba(20, 54, 40, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  commandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  commandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 96,
  },
  commandPillText: {
    color: '#25D366',
    fontSize: 11,
    fontWeight: '800',
  },
  commandDescText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
  },

  /* SECURITY FOOTER */
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  securityFooterText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    lineHeight: 15,
  },
});
