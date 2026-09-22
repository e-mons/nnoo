import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { MoneyText } from '../../components/MoneyText';
import { Badge } from '../../components/Badge';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function AppIndexScreen() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const { activeBusiness } = useBusiness();
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'today' | 'month'>('month');

  const [metrics, setMetrics] = useState<any>(null);
  const [position, setPosition] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchDashboard = async () => {
    if (!activeBusiness || !session?.user) return;
    
    const now = new Date();
    let startDate = new Date();
    if (period === 'month') {
      startDate.setDate(1);
    }
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = now.toISOString().split('T')[0];

    try {
      const [metricsRes, positionRes, unreadRes, pendingReviewsRes, salesRes, expensesRes] = await Promise.all([
        supabase.rpc('get_dashboard_performance_metrics', {
          p_business_id: activeBusiness.id,
          p_start_date: startStr,
          p_end_date: endStr,
        }),
        supabase.rpc('get_dashboard_current_position', {
          p_business_id: activeBusiness.id,
        }),
        supabase
          .from('business_notifications')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', activeBusiness.id)
          .eq('recipient_user_id', session.user.id)
          .is('read_at', null),
        supabase
          .from('ai_bookkeeping_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', activeBusiness.id)
          .eq('status', 'pending_review'),
        supabase
          .from('sales')
          .select('id, sale_number, total_minor, payment_status, occurred_at, created_at, customers ( name )')
          .eq('business_id', activeBusiness.id)
          .order('occurred_at', { ascending: false })
          .limit(5),
        supabase
          .from('expenses')
          .select('id, expense_number, total_minor, payment_status, status, occurred_at, created_at, suppliers ( name ), expense_categories ( name )')
          .eq('business_id', activeBusiness.id)
          .neq('status', 'reversed')
          .order('occurred_at', { ascending: false })
          .limit(5),
      ]);

      if (metricsRes.data) setMetrics(metricsRes.data);
      if (positionRes.data) setPosition(positionRes.data);
      if (unreadRes.count !== null && unreadRes.count !== undefined) setUnreadCount(unreadRes.count);
      if (pendingReviewsRes.count !== null && pendingReviewsRes.count !== undefined) setPendingReviewsCount(pendingReviewsRes.count);

      const salesList = salesRes.data || [];
      const expensesList = expensesRes.data || [];

      const combined = [
        ...salesList.map((s: any) => ({
          id: `sale-${s.id}`,
          originalId: s.id,
          type: 'sale' as const,
          title: `Sale #${s.sale_number}`,
          party: s.customers?.name || 'Walk-in Customer',
          amountMinor: parseInt(s.total_minor, 10) || 0,
          isMoneyIn: true,
          date: new Date(s.occurred_at || s.created_at),
          status: s.payment_status === 'paid' ? 'Paid in Full' : 'Awaiting Payment',
          isPaid: s.payment_status === 'paid',
          route: `/(app)/sales/${s.id}`,
        })),
        ...expensesList.map((e: any) => ({
          id: `expense-${e.id}`,
          originalId: e.id,
          type: 'expense' as const,
          title: e.expense_categories?.name || `Expense #${e.expense_number}`,
          party: e.suppliers?.name || 'Vendor / Supplier',
          amountMinor: parseInt(e.total_minor, 10) || 0,
          isMoneyIn: false,
          date: new Date(e.occurred_at || e.created_at),
          status: e.payment_status === 'paid' ? 'Paid in Full' : 'Unpaid Bill',
          isPaid: e.payment_status === 'paid',
          route: `/(app)/more/expenses/${e.id}`,
        })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);

      setRecentActivity(combined);
    } catch (error) {
      console.error('Error fetching dashboard', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [activeBusiness, period])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  if (!session || !activeBusiness) return null;

  const operatingResult = metrics?.operatingResultMinor || 0;
  const isPositiveResult = operatingResult >= 0;

  return (
    <View style={styles.container}>
      {/* Dynamic Ambient Background */}
      <LinearGradient
        colors={['#0A1C16', '#122E24', '#0A1C16']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
        >
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarWrapper}>
                <LinearGradient
                  colors={['#B8F25C', '#10b981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>
                    {activeBusiness.name.substring(0, 2).toUpperCase()}
                  </Text>
                </LinearGradient>
                <View style={styles.statusDot} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.greetingText}>
                  {getGreeting()}{profile?.first_name ? `, ${profile.first_name}` : ''}
                </Text>
                <Text style={styles.businessNameText} numberOfLines={1}>
                  {activeBusiness.name}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.headerActionBtn} 
                onPress={() => router.push('/(app)/notifications')}
                activeOpacity={0.7}
              >
                <Feather name="bell" size={18} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.headerActionBtn} 
                onPress={onRefresh}
                activeOpacity={0.7}
              >
                <Feather name="refresh-cw" size={18} color="#B8F25C" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Needs Attention Banner (if any pending alerts) */}
          {(unreadCount > 0 || pendingReviewsCount > 0 || (position?.lowStockCount || 0) > 0) && (
            <View style={styles.attentionBannerContainer}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.15)', 'rgba(239, 68, 68, 0.08)']}
                style={styles.attentionBanner}
              >
                <View style={styles.attentionHeaderRow}>
                  <View style={styles.attentionIconBadge}>
                    <Feather name="alert-circle" size={16} color="#F59E0B" />
                  </View>
                  <Text style={styles.attentionTitle}>Needs Attention</Text>
                </View>

                <View style={styles.attentionItemsRow}>
                  {pendingReviewsCount > 0 && (
                    <TouchableOpacity
                      style={styles.attentionPill}
                      onPress={() => router.push('/(app)/intelligence/bookkeeper')}
                      activeOpacity={0.8}
                    >
                      <Feather name="zap" size={12} color="#F59E0B" />
                      <Text style={styles.attentionPillText}>
                        {pendingReviewsCount} Bookkeeper {pendingReviewsCount === 1 ? 'Review' : 'Reviews'}
                      </Text>
                      <Feather name="chevron-right" size={12} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  )}

                  {(position?.lowStockCount || 0) > 0 && (
                    <TouchableOpacity
                      style={styles.attentionPill}
                      onPress={() => router.push('/(app)/inventory')}
                      activeOpacity={0.8}
                    >
                      <Feather name="box" size={12} color="#EF4444" />
                      <Text style={styles.attentionPillText}>
                        {position.lowStockCount} Low Stock
                      </Text>
                      <Feather name="chevron-right" size={12} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  )}

                  {unreadCount > 0 && (
                    <TouchableOpacity
                      style={styles.attentionPill}
                      onPress={() => router.push('/(app)/notifications')}
                      activeOpacity={0.8}
                    >
                      <Feather name="bell" size={12} color="#60A5FA" />
                      <Text style={styles.attentionPillText}>
                        {unreadCount} Unread {unreadCount === 1 ? 'Alert' : 'Alerts'}
                      </Text>
                      <Feather name="chevron-right" size={12} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Hero Financial Glance (Apple Wallet / Revolut Style Obsidian Card) */}
          <View style={styles.heroCardContainer}>
            <LinearGradient
              colors={['#103527', '#0A2017', '#071610']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              {/* Card Top Row: Live Store Status + Period Pill Switcher */}
              <View style={styles.heroHeader}>
                <View style={styles.heroTag}>
                  <View style={[styles.heroIndicator, { backgroundColor: isPositiveResult ? '#B8F25C' : '#FF4D4D' }]} />
                  <Text style={styles.heroTagText}>
                    {period === 'month' ? 'THIS MONTH' : 'TODAY'} • NET CASH
                  </Text>
                </View>

                {/* Embedded Period Switcher */}
                <View style={styles.heroPeriodToggle}>
                  <TouchableOpacity
                    style={[styles.heroPeriodBtn, period === 'today' && styles.heroPeriodBtnActive]}
                    onPress={() => setPeriod('today')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.heroPeriodText, period === 'today' && styles.heroPeriodTextActive]}>
                      Today
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.heroPeriodBtn, period === 'month' && styles.heroPeriodBtnActive]}
                    onPress={() => setPeriod('month')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.heroPeriodText, period === 'month' && styles.heroPeriodTextActive]}>
                      Month
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Main Balance Display */}
              <View style={styles.heroMainAmount}>
                <Text style={styles.heroSubLabel}>Available In Hand</Text>
                <MoneyText 
                  amountMinor={operatingResult} 
                  style={[styles.heroAmountText, { color: isPositiveResult ? '#FFFFFF' : '#FF8585' }]} 
                />
                <View style={styles.heroStatusRow}>
                  <Badge 
                    label={isPositiveResult ? 'Profitable operation' : 'Cash deficit'} 
                    variant={isPositiveResult ? 'success' : 'error'} 
                  />
                </View>
              </View>

              {/* 3-Column Micro Metrics Dock */}
              <View style={styles.heroMetricsDock}>
                <View style={styles.heroDockItem}>
                  <Text style={styles.heroDockLabel}>Cash In</Text>
                  <MoneyText 
                    amountMinor={metrics?.netSalesMinor || 0} 
                    style={[styles.heroDockValue, { color: '#B8F25C' }]} 
                  />
                </View>
                <View style={styles.heroDockSeparator} />
                <View style={styles.heroDockItem}>
                  <Text style={styles.heroDockLabel}>Cash Out</Text>
                  <MoneyText 
                    amountMinor={metrics?.operatingExpensesMinor || 0} 
                    style={[styles.heroDockValue, { color: '#FF7B72' }]} 
                  />
                </View>
                <View style={styles.heroDockSeparator} />
                <View style={styles.heroDockItem}>
                  <Text style={styles.heroDockLabel}>Owed by Clients</Text>
                  <MoneyText 
                    amountMinor={position?.accountsReceivableMinor || 0} 
                    style={[styles.heroDockValue, { color: '#79C0FF' }]} 
                  />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Signature 4 Circular Action Buttons (Cash App / Revolut Style) */}
          <View style={styles.actionStripContainer}>
            <TouchableOpacity 
              style={styles.actionCircleItem}
              onPress={() => router.push('/(app)/sales/new')}
              activeOpacity={0.75}
            >
              <View style={[styles.actionCircle, styles.actionCircleLime]}>
                <Feather name="plus" size={26} color="#0A1C16" />
              </View>
              <Text style={styles.actionCircleLabel}>New Sale</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCircleItem}
              onPress={() => router.push('/(app)/more/expenses/new')}
              activeOpacity={0.75}
            >
              <View style={[styles.actionCircle, styles.actionCircleRed]}>
                <Feather name="arrow-up-right" size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.actionCircleLabel}>Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCircleItem}
              onPress={() => router.push('/(app)/invoices/new')}
              activeOpacity={0.75}
            >
              <View style={[styles.actionCircle, styles.actionCircleBlue]}>
                <Feather name="file-text" size={22} color="#79C0FF" />
              </View>
              <Text style={styles.actionCircleLabel}>Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCircleItem}
              onPress={() => router.push('/(app)/more/products/new')}
              activeOpacity={0.75}
            >
              <View style={[styles.actionCircle, styles.actionCircleAmber]}>
                <Feather name="package" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.actionCircleLabel}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {/* Combined Live Activity Feed (iOS Grouped Table View Style) */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(184, 242, 92, 0.15)' }]}>
                <Feather name="clock" size={16} color="#B8F25C" />
              </View>
              <Text style={styles.sectionTitle}>Today's Transactions</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(app)/sales')} activeOpacity={0.7}>
              <Text style={styles.sectionSubBadgeLink}>View All in Money →</Text>
            </TouchableOpacity>
          </View>

          {recentActivity.length === 0 ? (
            <View style={styles.emptyActivityCard}>
              <Feather name="inbox" size={32} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyActivityTitle}>No transactions recorded yet today</Text>
              <Text style={styles.emptyActivitySub}>Tap "New Sale" above to record your first order!</Text>
            </View>
          ) : (
            <View style={styles.activityGroupCard}>
              {recentActivity.map((item, index) => {
                const isLast = index === recentActivity.length - 1;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.activityRow, isLast && styles.activityRowLast]}
                    onPress={() => router.push(item.route as any)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.activityRowLeft}>
                      <View style={[
                        styles.activityIconCircle,
                        { backgroundColor: item.isMoneyIn ? 'rgba(184, 242, 92, 0.12)' : 'rgba(255, 107, 107, 0.12)' }
                      ]}>
                        <Feather 
                          name={item.isMoneyIn ? 'arrow-down-left' : 'arrow-up-right'} 
                          size={18} 
                          color={item.isMoneyIn ? '#B8F25C' : '#FF7B72'} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityRowTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.activityRowSub} numberOfLines={1}>{item.party}</Text>
                      </View>
                    </View>

                    <View style={styles.activityRowRight}>
                      <MoneyText 
                        amountMinor={item.amountMinor} 
                        style={[
                          styles.activityRowAmount, 
                          { color: item.isMoneyIn ? '#B8F25C' : '#FF7B72' }
                        ]} 
                      />
                      <Badge 
                        label={item.status} 
                        variant={item.isPaid ? 'success' : 'warning'} 
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Consolidated Store Vital Signs Card (Replaces the 8 fragmented boxes) */}
          <View style={[styles.sectionHeader, { marginTop: 28 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(121, 192, 255, 0.15)' }]}>
                <Feather name="bar-chart-2" size={16} color="#79C0FF" />
              </View>
              <Text style={styles.sectionTitle}>Store Vital Signs</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(app)/more/reports' as any)} activeOpacity={0.7}>
              <Text style={styles.sectionSubBadgeLink}>Reports →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.vitalSignsCard}>
            <View style={styles.vitalGridRow}>
              <View style={styles.vitalGridCell}>
                <View style={styles.vitalHeaderRow}>
                  <Feather name="trending-up" size={15} color="#B8F25C" />
                  <Text style={styles.vitalCellLabel}>Gross Profit</Text>
                </View>
                <MoneyText amountMinor={metrics?.grossProfitMinor || 0} style={styles.vitalCellValue} />
                <Text style={styles.vitalCellSub}>Sales minus cost</Text>
              </View>

              <View style={styles.vitalGridDividerV} />

              <TouchableOpacity 
                style={styles.vitalGridCell}
                onPress={() => router.push('/(app)/inventory')}
                activeOpacity={0.7}
              >
                <View style={styles.vitalHeaderRow}>
                  <Feather name="package" size={15} color="#F59E0B" />
                  <Text style={styles.vitalCellLabel}>Stock on Hand</Text>
                </View>
                <MoneyText amountMinor={position?.inventoryValueMinor || 0} style={styles.vitalCellValue} />
                <Text style={[styles.vitalCellSub, (position?.lowStockCount || 0) > 0 && { color: '#FF7B72', fontWeight: '700' }]}>
                  {(position?.lowStockCount || 0) > 0 ? `${position.lowStockCount} items need restock` : 'Inventory healthy'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.vitalGridDividerH} />

            <View style={styles.vitalGridRow}>
              <TouchableOpacity 
                style={styles.vitalGridCell}
                onPress={() => router.push('/(app)/more/contacts' as any)}
                activeOpacity={0.7}
              >
                <View style={styles.vitalHeaderRow}>
                  <Feather name="users" size={15} color="#79C0FF" />
                  <Text style={styles.vitalCellLabel}>Money Clients Owe</Text>
                </View>
                <MoneyText amountMinor={position?.accountsReceivableMinor || 0} style={styles.vitalCellValue} />
                <Text style={styles.vitalCellSub}>Unpaid invoices</Text>
              </TouchableOpacity>

              <View style={styles.vitalGridDividerV} />

              <TouchableOpacity 
                style={styles.vitalGridCell}
                onPress={() => router.push('/(app)/more/expenses' as any)}
                activeOpacity={0.7}
              >
                <View style={styles.vitalHeaderRow}>
                  <Feather name="credit-card" size={15} color="#FF7B72" />
                  <Text style={styles.vitalCellLabel}>Bills & Payables</Text>
                </View>
                <MoneyText amountMinor={position?.accountsPayableMinor || 0} style={[styles.vitalCellValue, { color: '#FF7B72' }]} />
                <Text style={styles.vitalCellSub}>Owed to suppliers</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ask NNOO / AI Advisor Card */}
          <View style={[styles.sectionHeader, { marginTop: 28 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(184, 242, 92, 0.15)' }]}>
                <Feather name="cpu" size={16} color="#B8F25C" />
              </View>
              <Text style={styles.sectionTitle}>AI Business Advisor</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(app)/intelligence')} activeOpacity={0.7}>
              <Text style={styles.sectionSubBadgeLink}>All AI Tools →</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.aiAdvisorCard}
            onPress={() => router.push('/(app)/intelligence/assistant')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#103527', '#0A2017']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiAdvisorGradient}
            >
              <View style={styles.aiAdvisorLeft}>
                <View style={styles.aiAdvisorIconBox}>
                  <Feather name="message-square" size={20} color="#B8F25C" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.aiAdvisorTitleRow}>
                    <Text style={styles.aiAdvisorTitle}>Ask NNOO Anything</Text>
                    <View style={styles.aiPill}>
                      <Text style={styles.aiPillText}>AI COPILOT</Text>
                    </View>
                  </View>
                  <Text style={styles.aiAdvisorSubtitle} numberOfLines={2}>
                    "How are my sales performing today compared to last week?"
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="#B8F25C" />
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#06130E',
  },
  safeArea: { 
    flex: 1,
  },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: 18, 
    paddingBottom: 40,
  }, 
  
  /* Header Styles */
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 22,
    marginTop: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B8F25C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  avatarText: {
    color: '#0A1C16',
    fontWeight: '900',
    fontSize: 17,
    letterSpacing: -0.5,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#B8F25C',
    borderWidth: 2,
    borderColor: '#06130E',
  },
  headerTextGroup: {
    flex: 1,
  },
  greetingText: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.6)', 
    fontWeight: '500',
    marginBottom: 2,
  },
  businessNameText: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: '#FFFFFF', 
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#06130E',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  /* Attention Banner */
  attentionBannerContainer: {
    marginBottom: 18,
  },
  attentionBanner: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  attentionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  attentionIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionTitle: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  attentionItemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attentionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  attentionPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Hero Card (Apple Wallet / Revolut Style) */
  heroCardContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  heroCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(184, 242, 92, 0.22)',
    overflow: 'hidden',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.8,
  },
  heroPeriodToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroPeriodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  heroPeriodBtnActive: {
    backgroundColor: 'rgba(184, 242, 92, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.35)',
  },
  heroPeriodText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  heroPeriodTextActive: {
    color: '#B8F25C',
    fontWeight: '800',
  },
  heroMainAmount: {
    marginBottom: 12,
  },
  heroSubLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmountText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 6,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetricsDock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  heroDockItem: {
    flex: 1,
  },
  heroDockLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginBottom: 2,
  },
  heroDockValue: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroDockSeparator: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 10,
  },

  /* Signature 4 Circular Action Buttons (Cash App / Revolut Style) */
  actionStripContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  actionCircleItem: {
    alignItems: 'center',
    width: 72,
  },
  actionCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionCircleLime: {
    backgroundColor: '#B8F25C',
  },
  actionCircleRed: {
    backgroundColor: 'rgba(255, 107, 107, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 107, 0.45)',
  },
  actionCircleBlue: {
    backgroundColor: 'rgba(121, 192, 255, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(121, 192, 255, 0.45)',
  },
  actionCircleAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  actionCircleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: -0.2,
  },

  /* Section Headers */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { 
    fontSize: 17, 
    fontWeight: '900', 
    color: '#FFFFFF', 
    letterSpacing: -0.4,
  },
  sectionSubBadgeLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B8F25C',
  },

  /* Activity Group Card (iOS Grouped Table Style) */
  activityGroupCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(20, 54, 40, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  activityRowLast: {
    borderBottomWidth: 0,
  },
  activityRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  activityIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityRowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activityRowSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  activityRowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  activityRowAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  emptyActivityCard: {
    backgroundColor: 'rgba(20, 54, 40, 0.4)',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
    marginBottom: 8,
  },
  emptyActivityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  emptyActivitySub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },

  /* Store Vital Signs Card */
  vitalSignsCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(20, 54, 40, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  vitalGridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  vitalGridCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  vitalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  vitalCellLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  vitalCellValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  vitalCellSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
  },
  vitalGridDividerV: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  vitalGridDividerH: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  /* AI Advisor Card */
  aiAdvisorCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.22)',
    marginBottom: 8,
  },
  aiAdvisorGradient: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiAdvisorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 10,
  },
  aiAdvisorIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAdvisorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  aiAdvisorTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  aiPill: {
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.3)',
  },
  aiPillText: {
    color: '#B8F25C',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  aiAdvisorSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 16,
  },
});
