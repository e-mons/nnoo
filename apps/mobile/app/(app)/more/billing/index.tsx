import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../../components/Badge';
import { MoneyText } from '../../../../components/MoneyText';

export default function BillingIndexScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Checkout State
  const [checkingOutPlanCode, setCheckingOutPlanCode] = useState<string | null>(null);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const fetchBillingData = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const [subRes, plansRes, txRes] = await Promise.all([
        supabase
          .from('business_subscriptions')
          .select(`
            *,
            billing_plans (
              name,
              code,
              amount_minor,
              billing_interval,
              currency_code
            )
          `)
          .eq('business_id', activeBusiness.id)
          .maybeSingle(),
        supabase
          .from('billing_plans')
          .select('*')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('billing_transactions')
          .select('*, billing_plans(name, code)')
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (subRes.error && subRes.error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subRes.error);
      }

      setSubscription(subRes.data);
      setPlans(plansRes.data || []);
      setTransactions(txRes.data || []);
    } catch (err) {
      console.error('Error fetching billing data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBillingData();
    }, [activeBusiness])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBillingData();
  };

  const handleSubscribePlan = async (planCode: string) => {
    if (!activeBusiness) return;
    setCheckingOutPlanCode(planCode);

    try {
      // Get current auth session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Call internal checkout API (defaulting to production domain or local fallback)
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://nnoo.app';
      const response = await fetch(`${baseUrl}/api/v1/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId: activeBusiness.id,
          planCode,
        }),
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.authorizationUrl) {
        throw new Error(resJson.error || 'Failed to initialize payment gateway.');
      }

      setPendingReference(resJson.reference);

      // Open Paystack checkout in device browser
      await Linking.openURL(resJson.authorizationUrl);
    } catch (err: any) {
      console.error('Checkout error:', err);
      Alert.alert(
        'Subscription Checkout',
        err.message || 'Unable to open payment gateway. Please ensure your internet connection is active.'
      );
    } finally {
      setCheckingOutPlanCode(null);
    }
  };

  const handleVerifyPayment = async () => {
    if (!pendingReference || !activeBusiness) return;
    setVerifyingPayment(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://nnoo.app';
      const response = await fetch(`${baseUrl}/api/v1/billing/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId: activeBusiness.id,
          reference: pendingReference,
        }),
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'Payment not confirmed yet. If you just paid, please wait a moment.');
      }

      setPendingReference(null);
      Alert.alert('Payment Verified!', 'Your subscription is now active with all premium business features unlocked.');
      fetchBillingData();
    } catch (err: any) {
      console.error('Verification error:', err);
      Alert.alert('Verification Check', err.message || 'Verification could not be confirmed.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const formatMoney = (minorUnits: number, currency: string) => {
    if (!minorUnits) return '0.00';
    const amount = minorUnits / 100;
    return `${currency || 'NGN'} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPlanFeatures = (planCode: string) => {
    if (planCode?.includes('enterprise')) {
      return [
        'Unlimited Team Members & Multi-Role RBAC',
        'Multi-Warehouse Inventory & Movements',
        'Custom POS & Invoicing with Direct Payment Gateways',
        'Automated P&L, Balance Sheet & Financial Audit',
        'Dedicated 24/7 Priority Support',
      ];
    }
    if (planCode?.includes('growth') || planCode?.includes('pro')) {
      return [
        'Up to 10 Team Members with Role Permissions',
        'Complete Real-time Inventory & Stock Intake',
        'Custom Invoices, Receipts & Overdue Reminders',
        'Profitability & Sales Trend Reports',
        'Email & Chat Business Support',
      ];
    }
    return [
      'Up to 3 Active Team Members',
      'Point-of-Sale Register & Sales Invoices',
      'Inventory Stock Tracking & Low Stock Alerts',
      'Basic Sales & Expense Summary Reports',
    ];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Billing & Subscription</Text>
          <Text style={styles.subtext}>Manage your NNOO workspace plan</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#B8F25C" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#B8F25C"
            />
          }
        >
          {/* Active Subscription Banner */}
          {subscription ? (
            <View style={styles.subscriptionCard}>
              <View style={styles.subCardHeader}>
                <View>
                  <Text style={styles.subCardLabel}>Current Active Plan</Text>
                  <Text style={styles.subPlanName}>
                    {subscription.billing_plans?.name || 'Standard Plan'}
                  </Text>
                </View>
                <Badge
                  label={subscription.normalized_status?.toUpperCase() || 'ACTIVE'}
                  variant={subscription.normalized_status === 'active' ? 'success' : 'error'}
                />
              </View>

              <View style={styles.subDivider} />

              <View style={styles.subMetaRow}>
                <Text style={styles.subMetaLabel}>Billing Interval</Text>
                <Text style={styles.subMetaValue}>
                  {subscription.billing_plans?.billing_interval?.toUpperCase() || 'MONTHLY'}
                </Text>
              </View>

              {subscription.next_payment_at && (
                <View style={styles.subMetaRow}>
                  <Text style={styles.subMetaLabel}>Renewal Date</Text>
                  <Text style={styles.subMetaValue}>
                    {new Date(subscription.next_payment_at).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {subscription.billing_plans?.amount_minor && (
                <View style={styles.subMetaRow}>
                  <Text style={styles.subMetaLabel}>Rate</Text>
                  <Text style={[styles.subMetaValue, { color: '#B8F25C' }]}>
                    {formatMoney(
                      subscription.billing_plans.amount_minor,
                      subscription.billing_plans.currency_code
                    )}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noSubCard}>
              <Feather name="shield" size={36} color="#B8F25C" />
              <Text style={styles.noSubTitle}>No Active Subscription</Text>
              <Text style={styles.noSubText}>
                Select a business plan below to unlock multi-user collaboration, automated invoices, and full inventory management.
              </Text>
            </View>
          )}

          {/* Pending Payment Verification Banner */}
          {pendingReference && (
            <View style={styles.pendingVerifyCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingVerifyTitle}>Payment in Progress</Text>
                <Text style={styles.pendingVerifySub}>
                  Ref: {pendingReference}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.verifyActionBtn}
                onPress={handleVerifyPayment}
                disabled={verifyingPayment}
                activeOpacity={0.8}
              >
                {verifyingPayment ? (
                  <ActivityIndicator color="#0A1C16" />
                ) : (
                  <Text style={styles.verifyActionBtnText}>Verify Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Available Plans */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Available Business Plans</Text>
          </View>

          {plans.map((plan) => {
            const isCurrentPlan = subscription?.billing_plan_id === plan.id;
            const isCheckingOut = checkingOutPlanCode === plan.code;
            const features = getPlanFeatures(plan.code);

            return (
              <View
                key={plan.id}
                style={[styles.planCard, isCurrentPlan && styles.planCardActive]}
              >
                <View style={styles.planCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDesc}>{plan.description}</Text>
                  </View>
                  {isCurrentPlan && (
                    <Badge label="CURRENT" variant="success" />
                  )}
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>
                    {formatMoney(plan.amount_minor, plan.currency_code)}
                  </Text>
                  <Text style={styles.planInterval}>/{plan.billing_interval}</Text>
                </View>

                <View style={styles.featuresList}>
                  {features.map((feat, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Feather name="check-circle" size={14} color="#B8F25C" />
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.planActionBtn,
                    isCurrentPlan && styles.planActionBtnCurrent,
                    isCheckingOut && styles.planActionBtnDisabled,
                  ]}
                  onPress={() => handleSubscribePlan(plan.code)}
                  disabled={isCheckingOut || isCurrentPlan}
                  activeOpacity={0.8}
                >
                  {isCheckingOut ? (
                    <ActivityIndicator color="#0A1C16" />
                  ) : (
                    <Text
                      style={[
                        styles.planActionBtnText,
                        isCurrentPlan && styles.planActionBtnTextCurrent,
                      ]}
                    >
                      {isCurrentPlan
                        ? 'Current Workspace Plan'
                        : subscription
                        ? 'Switch to this Plan'
                        : 'Subscribe with Paystack'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Billing Transaction History */}
          {transactions.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Payment Receipts & History</Text>
              {transactions.map((tx) => {
                const isSuccess = tx.normalized_status === 'success';
                const isFailed = tx.normalized_status === 'failed';

                return (
                  <View key={tx.id} style={styles.txCard}>
                    <View style={styles.txHeader}>
                      <View>
                        <Text style={styles.txPlanName}>
                          {tx.billing_plans?.name || 'Platform Subscription'}
                        </Text>
                        <Text style={styles.txDate}>
                          {new Date(tx.paid_at || tx.created_at).toLocaleDateString()} • Ref: {tx.provider_reference?.substring(0, 18)}...
                        </Text>
                      </View>
                      <Badge
                        label={isSuccess ? 'Paid' : isFailed ? 'Failed' : 'Pending'}
                        variant={isSuccess ? 'success' : isFailed ? 'error' : 'warning'}
                      />
                    </View>

                    <View style={styles.txFooter}>
                      <Text style={styles.txChannel}>
                        Channel: {tx.channel ? tx.channel.toUpperCase() : 'Paystack Secure'}
                      </Text>
                      <MoneyText amountMinor={tx.amount_minor} style={styles.txAmount} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  backButton: { marginRight: 14, padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },

  subscriptionCard: {
    backgroundColor: '#0E291E',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.3)',
    marginBottom: 20,
  },
  subCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  subCardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  subPlanName: { fontSize: 24, fontWeight: '900', color: '#FFF', marginTop: 4 },
  subDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 14 },
  subMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  subMetaLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  subMetaValue: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  noSubCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
    gap: 8,
  },
  noSubTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', marginTop: 6 },
  noSubText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },

  pendingVerifyCard: {
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  pendingVerifyTitle: { fontSize: 14, fontWeight: '800', color: '#FF9800' },
  pendingVerifySub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  verifyActionBtn: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  verifyActionBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 13 },

  sectionHeaderRow: { marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#FFF' },

  planCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  planCardActive: {
    borderColor: 'rgba(184, 242, 92, 0.5)',
    backgroundColor: 'rgba(184, 242, 92, 0.04)',
  },
  planCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  planName: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  planDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 18 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 10 },
  planPrice: { fontSize: 28, fontWeight: '900', color: '#B8F25C' },
  planInterval: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '700', marginLeft: 4 },

  featuresList: { marginVertical: 12, gap: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  planActionBtn: {
    backgroundColor: '#B8F25C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  planActionBtnCurrent: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  planActionBtnDisabled: { opacity: 0.5 },
  planActionBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 15 },
  planActionBtnTextCurrent: { color: 'rgba(255,255,255,0.6)' },

  historySection: { marginTop: 12, marginBottom: 20 },
  txCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  txPlanName: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  txDate: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  txChannel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  txAmount: { fontSize: 16, fontWeight: '900', color: '#B8F25C' },
});
