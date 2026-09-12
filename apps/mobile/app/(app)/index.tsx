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
      const [metricsRes, positionRes, unreadRes, pendingReviewsRes] = await Promise.all([
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
      ]);

      if (metricsRes.data) setMetrics(metricsRes.data);
      if (positionRes.data) setPosition(positionRes.data);
      if (unreadRes.count !== null && unreadRes.count !== undefined) setUnreadCount(unreadRes.count);
      if (pendingReviewsRes.count !== null && pendingReviewsRes.count !== undefined) setPendingReviewsCount(pendingReviewsRes.count);
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
        colors={['#06130E', '#0B2219', '#06130E']}
        style={StyleSheet.absoluteFillObject}
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

          {/* Hero Financial Health Card */}
          <View style={styles.heroCardContainer}>
            <LinearGradient
              colors={['#133829', '#0D271D', '#0A1C16']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              {/* Subtle top highlight border */}
              <View style={styles.heroTopHighlight} />

              <View style={styles.heroHeader}>
                <View style={styles.heroTag}>
                  <View style={[styles.heroIndicator, { backgroundColor: isPositiveResult ? '#B8F25C' : '#FF4D4D' }]} />
                  <Text style={styles.heroTagText}>
                    {period === 'month' ? 'THIS MONTH' : 'TODAY'} • OPERATING RESULT
                  </Text>
                </View>
                <Badge 
                  label={isPositiveResult ? 'Profitable' : 'Attention'} 
                  variant={isPositiveResult ? 'success' : 'error'} 
                />
              </View>

              <View style={styles.heroMainAmount}>
                <MoneyText 
                  amountMinor={operatingResult} 
                  style={[styles.heroAmountText, { color: isPositiveResult ? '#B8F25C' : '#FF4D4D' }]} 
                />
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Gross Profit</Text>
                  <MoneyText 
                    amountMinor={metrics?.grossProfitMinor || 0} 
                    style={styles.heroStatValue} 
                  />
                </View>
                <View style={styles.heroStatSeparator} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>Expenses</Text>
                  <MoneyText 
                    amountMinor={metrics?.operatingExpensesMinor || 0} 
                    style={[styles.heroStatValue, { color: '#FFA0A0' }]} 
                  />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions Bar */}
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => router.push('/(app)/sales/new')}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={['rgba(184, 242, 92, 0.2)', 'rgba(184, 242, 92, 0.05)']}
                style={styles.actionIconCircle}
              >
                <Feather name="plus" size={20} color="#B8F25C" />
              </LinearGradient>
              <Text style={styles.actionBtnText}>New Sale</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => router.push('/(app)/invoices')}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
                style={styles.actionIconCircle}
              >
                <Feather name="file-plus" size={19} color="#60A5FA" />
              </LinearGradient>
              <Text style={styles.actionBtnText}>Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => router.push('/(app)/inventory')}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']}
                style={styles.actionIconCircle}
              >
                <Feather name="box" size={19} color="#FBBF24" />
              </LinearGradient>
              <Text style={styles.actionBtnText}>Stock</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => router.push('/(app)/more/expenses')}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)']}
                style={styles.actionIconCircle}
              >
                <Feather name="credit-card" size={19} color="#F87171" />
              </LinearGradient>
              <Text style={styles.actionBtnText}>Expense</Text>
            </TouchableOpacity>
          </View>

          {/* Period Toggle Switcher */}
          <View style={styles.periodSwitcherWrapper}>
            <View style={styles.periodSwitcher}>
              <TouchableOpacity
                style={[styles.periodOption, period === 'today' && styles.periodOptionActive]}
                onPress={() => setPeriod('today')}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodOptionText, period === 'today' && styles.periodOptionTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodOption, period === 'month' && styles.periodOptionActive]}
                onPress={() => setPeriod('month')}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodOptionText, period === 'month' && styles.periodOptionTextActive]}>
                  This Month
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Performance Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(184, 242, 92, 0.15)' }]}>
                <Feather name="activity" size={16} color="#B8F25C" />
              </View>
              <Text style={styles.sectionTitle}>Performance</Text>
            </View>
            <Text style={styles.sectionSubBadge}>Real-time</Text>
          </View>
          
          <View style={styles.grid}>
            {/* Net Sales Card */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                style={styles.metricCard}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(184, 242, 92, 0.12)' }]}>
                    <Feather name="trending-up" size={16} color="#B8F25C" />
                  </View>
                  <Text style={styles.cardLabel}>Net Sales</Text>
                </View>
                <MoneyText amountMinor={metrics?.netSalesMinor || 0} style={styles.cardValue} />
                <Text style={styles.cardSubtext}>Revenue generated</Text>
              </LinearGradient>
            </View>

            {/* Gross Profit Card */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                style={styles.metricCard}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(96, 165, 250, 0.12)' }]}>
                    <Feather name="pie-chart" size={16} color="#60A5FA" />
                  </View>
                  <Text style={styles.cardLabel}>Gross Profit</Text>
                </View>
                <MoneyText amountMinor={metrics?.grossProfitMinor || 0} style={styles.cardValue} />
                <Text style={styles.cardSubtext}>Before overheads</Text>
              </LinearGradient>
            </View>

            {/* Operating Expenses Card */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                style={styles.metricCard}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(248, 113, 113, 0.12)' }]}>
                    <Feather name="trending-down" size={16} color="#F87171" />
                  </View>
                  <Text style={styles.cardLabel}>Expenses</Text>
                </View>
                <MoneyText amountMinor={metrics?.operatingExpensesMinor || 0} style={[styles.cardValue, { color: '#F87171' }]} />
                <Text style={styles.cardSubtext}>Operations & bills</Text>
              </LinearGradient>
            </View>

            {/* Net Margin / Op. Result Card */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                style={styles.metricCard}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: isPositiveResult ? 'rgba(184, 242, 92, 0.15)' : 'rgba(248, 113, 113, 0.15)' }]}>
                    <Feather name="check-circle" size={16} color={isPositiveResult ? '#B8F25C' : '#F87171'} />
                  </View>
                  <Text style={styles.cardLabel}>Net Result</Text>
                </View>
                <MoneyText 
                  amountMinor={operatingResult} 
                  style={[styles.cardValue, { color: isPositiveResult ? '#B8F25C' : '#F87171' }]} 
                />
                <Text style={styles.cardSubtext}>{isPositiveResult ? 'Net surplus' : 'Net deficit'}</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Current Position / Balance Sheet Section */}
          <View style={[styles.sectionHeader, { marginTop: 28 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
                <Feather name="compass" size={16} color="#60A5FA" />
              </View>
              <Text style={styles.sectionTitle}>Financial Position</Text>
            </View>
            <Text style={styles.sectionSubBadge}>Balance Sheet</Text>
          </View>
          
          <View style={styles.grid}>
            {/* Receivables */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                style={styles.metricCard}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
                    <Feather name="arrow-down-left" size={16} color="#34D399" />
                  </View>
                  <Text style={styles.cardLabel}>Receivables</Text>
                </View>
                <MoneyText amountMinor={position?.accountsReceivableMinor || 0} style={styles.cardValue} />
                <Text style={styles.cardSubtext}>Owed by clients</Text>
              </LinearGradient>
            </View>

            {/* Payables */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                style={styles.metricCard}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(251, 146, 60, 0.12)' }]}>
                    <Feather name="arrow-up-right" size={16} color="#FB923C" />
                  </View>
                  <Text style={styles.cardLabel}>Payables</Text>
                </View>
                <MoneyText amountMinor={position?.accountsPayableMinor || 0} style={[styles.cardValue, { color: '#FB923C' }]} />
                <Text style={styles.cardSubtext}>Owed to vendors</Text>
              </LinearGradient>
            </View>

            {/* Inventory Valuation */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                style={styles.metricCard}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(167, 139, 250, 0.12)' }]}>
                    <Feather name="package" size={16} color="#A78BFA" />
                  </View>
                  <Text style={styles.cardLabel}>Stock Value</Text>
                </View>
                <MoneyText amountMinor={position?.inventoryValueMinor || 0} style={styles.cardValue} />
                <Text style={styles.cardSubtext}>Assets on hand</Text>
              </LinearGradient>
            </View>

            {/* Low Stock Alerts */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                style={styles.metricCard}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: (position?.lowStockCount || 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(184, 242, 92, 0.12)' }]}>
                    <Feather 
                      name="alert-triangle" 
                      size={16} 
                      color={(position?.lowStockCount || 0) > 0 ? '#EF4444' : '#B8F25C'} 
                    />
                  </View>
                  <Text style={styles.cardLabel}>Low Stock</Text>
                </View>
                <Text style={[styles.cardValue, (position?.lowStockCount || 0) > 0 && { color: '#EF4444' }]}>
                  {position?.lowStockCount || 0}
                </Text>
                <Text style={styles.cardSubtext}>
                  {(position?.lowStockCount || 0) > 0 ? 'Restock required' : 'All items optimal'}
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Smart Business Tools & AI Section */}
          <View style={[styles.sectionHeader, { marginTop: 32 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(184, 242, 92, 0.15)' }]}>
                <Feather name="cpu" size={16} color="#B8F25C" />
              </View>
              <Text style={styles.sectionTitle}>Smart Business Tools</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/(app)/intelligence')}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionSubBadge, { color: '#B8F25C' }]}>View All →</Text>
            </TouchableOpacity>
          </View>

          {/* Ask NNOO Featured Banner */}
          <TouchableOpacity
            style={styles.askNnooBannerContainer}
            onPress={() => router.push('/(app)/intelligence/assistant')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#103527', '#0A2218']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.askNnooBanner}
            >
              <View style={styles.askNnooLeft}>
                <View style={styles.askNnooIconBox}>
                  <Feather name="message-square" size={20} color="#B8F25C" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.askNnooTitleRow}>
                    <Text style={styles.askNnooTitle}>Ask NNOO</Text>
                    <View style={styles.aiPill}>
                      <Text style={styles.aiPillText}>AI ASSISTANT</Text>
                    </View>
                  </View>
                  <Text style={styles.askNnooSubtitle} numberOfLines={2}>
                    Ask questions about your sales, margins, debt, and inventory.
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="#B8F25C" />
            </LinearGradient>
          </TouchableOpacity>

          {/* 2x2 Smart Tools Grid */}
          <View style={styles.grid}>
            {/* AI Bookkeeper */}
            <TouchableOpacity 
              style={styles.cardWrapper}
              onPress={() => router.push('/(app)/intelligence/bookkeeper')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.1)', 'rgba(255,255,255,0.02)']}
                style={styles.toolCard}
              >
                <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                  <Feather name="zap" size={16} color="#F59E0B" />
                </View>
                <Text style={styles.toolCardTitle}>AI Bookkeeper</Text>
                <Text style={styles.toolCardDesc}>
                  {pendingReviewsCount > 0 ? `${pendingReviewsCount} to review` : 'Classify transactions'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Smart Insights */}
            <TouchableOpacity 
              style={styles.cardWrapper}
              onPress={() => router.push('/(app)/intelligence/insights')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.1)', 'rgba(255,255,255,0.02)']}
                style={styles.toolCard}
              >
                <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                  <Feather name="trending-up" size={16} color="#60A5FA" />
                </View>
                <Text style={styles.toolCardTitle}>Smart Insights</Text>
                <Text style={styles.toolCardDesc}>Verified business summaries</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Business Health */}
            <TouchableOpacity 
              style={styles.cardWrapper}
              onPress={() => router.push('/(app)/intelligence/health')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.1)', 'rgba(255,255,255,0.02)']}
                style={styles.toolCard}
              >
                <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <Feather name="activity" size={16} color="#34D399" />
                </View>
                <Text style={styles.toolCardTitle}>Business Health</Text>
                <Text style={styles.toolCardDesc}>Operational health score</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Credit Passport */}
            <TouchableOpacity 
              style={styles.cardWrapper}
              onPress={() => router.push('/(app)/intelligence/passport')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(20, 184, 166, 0.1)', 'rgba(255,255,255,0.02)']}
                style={styles.toolCard}
              >
                <View style={[styles.iconBox, { backgroundColor: 'rgba(20, 184, 166, 0.2)' }]}>
                  <Feather name="award" size={16} color="#14B8A6" />
                </View>
                <Text style={styles.toolCardTitle}>Credit Passport</Text>
                <Text style={styles.toolCardDesc}>Verified financial profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

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
    paddingTop: 12, 
    paddingBottom: 130,
  }, 
  
  /* Header Styles */
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24,
    marginTop: 4,
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

  /* Hero Card */
  heroCardContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  heroCard: {
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.22)',
    overflow: 'hidden',
    position: 'relative',
  },
  heroTopHighlight: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 1.5,
    backgroundColor: '#B8F25C',
    opacity: 0.6,
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
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.8,
  },
  heroMainAmount: {
    marginBottom: 16,
  },
  heroAmountText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroStatItem: {
    flex: 1,
  },
  heroStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    marginBottom: 2,
  },
  heroStatValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroStatSeparator: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
  },

  /* Quick Actions */
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  /* Period Switcher */
  periodSwitcherWrapper: {
    marginBottom: 24,
  },
  periodSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  periodOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  periodOptionActive: {
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.3)',
  },
  periodOptionText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    fontSize: 13,
  },
  periodOptionTextActive: {
    color: '#B8F25C',
    fontWeight: '800',
  },

  /* Section Headers */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 18, 
    fontWeight: '900', 
    color: '#FFFFFF', 
    letterSpacing: -0.4,
  },
  sectionSubBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Metric Cards Grid */
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    rowGap: 12,
  },
  cardWrapper: {
    width: '48.2%',
  },
  metricCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: -0.2,
  },
  cardValue: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: '#FFFFFF', 
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },

  /* Ask NNOO Banner */
  askNnooBannerContainer: {
    marginBottom: 16,
  },
  askNnooBanner: {
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
  },
  askNnooLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 10,
  },
  askNnooIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  askNnooTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  askNnooTitle: {
    color: '#FFFFFF',
    fontSize: 16,
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
  askNnooSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 16,
  },

  /* Tool Cards */
  toolCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minHeight: 110,
    justifyContent: 'space-between',
  },
  toolCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 2,
  },
  toolCardDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    lineHeight: 14,
  },
});
