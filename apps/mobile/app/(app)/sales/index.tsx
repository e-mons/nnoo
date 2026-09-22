import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { MoneyText } from '../../../components/MoneyText';
import { Badge } from '../../../components/Badge';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type HubTab = 'activity' | 'sales' | 'invoices' | 'receipts' | 'expenses' | 'bookkeeper';

export default function MoneyHubScreen() {
  const { activeBusiness } = useBusiness();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<HubTab>('activity');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionModalVisible, setActionModalVisible] = useState(false);

  // Data sets
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);

  // Filter for sales sub-tab
  const [salesFilter, setSalesFilter] = useState<'all' | 'paid' | 'unpaid' | 'refunded'>('all');

  const fetchHubData = async () => {
    if (!activeBusiness) return;
    try {
      const [salesRes, expensesRes, invoicesRes, receiptsRes] = await Promise.all([
        supabase
          .from('sales')
          .select(`
            id,
            sale_number,
            total_minor,
            payment_status,
            refund_status,
            occurred_at,
            created_at,
            customers ( id, name )
          `)
          .eq('business_id', activeBusiness.id)
          .order('occurred_at', { ascending: false })
          .limit(100),
        supabase
          .from('expenses')
          .select(`
            id,
            expense_number,
            total_minor,
            status,
            payment_status,
            occurred_at,
            created_at,
            expense_categories ( id, name ),
            suppliers ( id, name )
          `)
          .eq('business_id', activeBusiness.id)
          .neq('status', 'reversed')
          .order('occurred_at', { ascending: false })
          .limit(100),
        supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            total_minor,
            document_status,
            issue_date,
            due_date,
            created_at,
            customers ( id, name ),
            sales ( id, payment_status )
          `)
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('receipts')
          .select(`
            id,
            receipt_number,
            amount_minor,
            currency_code,
            payment_occurred_at,
            payment_method_snapshot,
            customer_snapshot,
            sale_number_snapshot
          `)
          .eq('business_id', activeBusiness.id)
          .order('payment_occurred_at', { ascending: false })
          .limit(100),
      ]);

      if (salesRes.error) console.error('Error fetching sales:', salesRes.error);
      if (expensesRes.error) console.error('Error fetching expenses:', expensesRes.error);
      if (invoicesRes.error) console.error('Error fetching invoices:', invoicesRes.error);
      if (receiptsRes.error) console.error('Error fetching receipts:', receiptsRes.error);

      setSales(salesRes.data || []);
      setExpenses(expensesRes.data || []);
      setInvoices(invoicesRes.data || []);
      setReceipts(receiptsRes.data || []);
    } catch (err) {
      console.error('MoneyHub: error loading financial hub data', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHubData();
    }, [activeBusiness])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHubData();
    setRefreshing(false);
  };

  // High-level Financial KPIs
  const totalSalesMinor = useMemo(() => {
    return sales.reduce((sum, s) => sum + (parseInt(s.total_minor, 10) || 0), 0);
  }, [sales]);

  const totalExpensesMinor = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (parseInt(e.total_minor, 10) || 0), 0);
  }, [expenses]);

  const netCashMinor = useMemo(() => {
    return totalSalesMinor - totalExpensesMinor;
  }, [totalSalesMinor, totalExpensesMinor]);

  const unpaidInvoicesTotalMinor = useMemo(() => {
    return invoices
      .filter((i) => i.document_status === 'issued' && i.sales?.payment_status !== 'paid')
      .reduce((sum, i) => sum + (parseInt(i.total_minor, 10) || 0), 0);
  }, [invoices]);

  // Combined Activity Stream
  const activityFeed = useMemo(() => {
    const feed = [
      ...sales.map((s) => ({
        id: `sale-${s.id}`,
        originalId: s.id,
        type: 'sale' as const,
        title: `Sale #${s.sale_number}`,
        party: s.customers?.name || 'Walk-in Customer',
        amountMinor: parseInt(s.total_minor, 10) || 0,
        isMoneyIn: true,
        date: new Date(s.occurred_at || s.created_at),
        status: s.payment_status,
      })),
      ...expenses.map((e) => ({
        id: `expense-${e.id}`,
        originalId: e.id,
        type: 'expense' as const,
        title: e.expense_categories?.name || `Expense #${e.expense_number}`,
        party: e.suppliers?.name || 'Vendor / Supplier',
        amountMinor: parseInt(e.total_minor, 10) || 0,
        isMoneyIn: false,
        date: new Date(e.occurred_at || e.created_at),
        status: e.status || e.payment_status,
      })),
    ];

    feed.sort((a, b) => b.date.getTime() - a.date.getTime());

    if (!search.trim()) return feed;
    const query = search.toLowerCase();
    return feed.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.party.toLowerCase().includes(query)
    );
  }, [sales, expenses, search]);

  // Filtered Sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchesSearch =
        s.sale_number?.toLowerCase().includes(search.toLowerCase()) ||
        (s.customers?.name && s.customers.name.toLowerCase().includes(search.toLowerCase()));

      let matchesFilter = true;
      if (salesFilter === 'paid') matchesFilter = s.payment_status === 'paid';
      else if (salesFilter === 'unpaid') matchesFilter = s.payment_status === 'unpaid' || s.payment_status === 'partially_paid';
      else if (salesFilter === 'refunded') matchesFilter = s.refund_status === 'refunded' || s.refund_status === 'partially_refunded';

      return matchesSearch && matchesFilter;
    });
  }, [sales, search, salesFilter]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    if (!search.trim()) return invoices;
    const query = search.toLowerCase();
    return invoices.filter(
      (i) =>
        i.invoice_number?.toLowerCase().includes(query) ||
        (i.customers?.name && i.customers.name.toLowerCase().includes(query))
    );
  }, [invoices, search]);

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    if (!search.trim()) return receipts;
    const query = search.toLowerCase();
    return receipts.filter((r) => {
      const customerName = r.customer_snapshot?.name || '';
      return (
        r.receipt_number?.toLowerCase().includes(query) ||
        customerName.toLowerCase().includes(query) ||
        r.sale_number_snapshot?.toLowerCase().includes(query)
      );
    });
  }, [receipts, search]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    if (!search.trim()) return expenses;
    const query = search.toLowerCase();
    return expenses.filter(
      (e) =>
        e.expense_number?.toLowerCase().includes(query) ||
        (e.expense_categories?.name && e.expense_categories.name.toLowerCase().includes(query)) ||
        (e.suppliers?.name && e.suppliers.name.toLowerCase().includes(query))
    );
  }, [expenses, search]);

  const tabs: { key: HubTab; label: string; count?: number }[] = [
    { key: 'activity', label: 'Cash Flow', count: activityFeed.length },
    { key: 'sales', label: 'Sales Orders', count: sales.length },
    { key: 'invoices', label: 'Invoices', count: invoices.length },
    { key: 'receipts', label: 'Receipts', count: receipts.length },
    { key: 'expenses', label: 'Expenses', count: expenses.length },
    { key: 'bookkeeper', label: 'AI Review' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A1C16', '#0F261E', '#0A1C16']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header with Title and Quick Actions */}
        <View style={styles.header}>
          <View>
            <View style={styles.tag}>
              <Feather name="dollar-sign" size={12} color="#B8F25C" />
              <Text style={styles.tagText}>Unified Financial Hub</Text>
            </View>
            <Text style={styles.title}>Money & Sales</Text>
            <Text style={styles.subtitle}>All your cash flow, sales, receipts and bills</Text>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => setActionModalVisible(true)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={16} color="#0A1C16" />
              <Text style={styles.primaryActionBtnText}>+ New</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => router.push('/(app)/sales/new' as any)}
              activeOpacity={0.8}
            >
              <Feather name="shopping-bag" size={14} color="#B8F25C" />
              <Text style={styles.secondaryActionBtnText}>Sale</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => router.push('/(app)/more/expenses/new' as any)}
              activeOpacity={0.8}
            >
              <Feather name="minus-circle" size={14} color="#FF7B72" />
              <Text style={styles.secondaryActionBtnText}>Expense</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Financial KPIs Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.kpiScrollView}
          contentContainerStyle={styles.kpiContainer}
        >
          {/* Total Sales (Cash In) */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Cash In (Sales)</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(184, 242, 92, 0.15)' }]}>
                <Feather name="arrow-down-left" size={14} color="#B8F25C" />
              </View>
            </View>
            <MoneyText amountMinor={totalSalesMinor} style={styles.kpiMoneyGreen} />
            <Text style={styles.kpiSubtext}>{sales.length} total orders</Text>
          </View>

          {/* Total Expenses (Cash Out) */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Cash Out (Bills)</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(255, 123, 114, 0.15)' }]}>
                <Feather name="arrow-up-right" size={14} color="#FF7B72" />
              </View>
            </View>
            <MoneyText amountMinor={totalExpensesMinor} style={styles.kpiMoneyRed} />
            <Text style={styles.kpiSubtext}>{expenses.length} recorded items</Text>
          </View>

          {/* Net Cash Position */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Net Cash</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(121, 192, 255, 0.15)' }]}>
                <Feather name="activity" size={14} color="#79C0FF" />
              </View>
            </View>
            <MoneyText
              amountMinor={Math.abs(netCashMinor)}
              prefix={netCashMinor < 0 ? '- ' : '+ '}
              style={netCashMinor >= 0 ? styles.kpiMoneyGreen : styles.kpiMoneyRed}
            />
            <Text style={styles.kpiSubtext}>Cash in minus cash out</Text>
          </View>

          {/* Unpaid Invoices */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Money Owed to You</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(240, 136, 62, 0.15)' }]}>
                <Feather name="clock" size={14} color="#F0883E" />
              </View>
            </View>
            <MoneyText amountMinor={unpaidInvoicesTotalMinor} style={styles.kpiMoneyOrange} />
            <Text style={styles.kpiSubtext}>Pending customer dues</Text>
          </View>
        </ScrollView>

        {/* Tab Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScrollView}
          contentContainerStyle={styles.tabsContainer}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {tab.count !== undefined && (
                  <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Search Bar (except for bookkeeper tab) */}
        {activeTab !== 'bookkeeper' && (
          <View style={styles.searchSection}>
            <Feather name="search" size={16} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search in ${activeTab}...`}
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={search}
              onChangeText={setSearch}
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
                <Feather name="x" size={14} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Sub-tab filter if on Sales tab */}
        {activeTab === 'sales' && (
          <View style={styles.subFilterRow}>
            {(['all', 'paid', 'unpaid', 'refunded'] as const).map((filterOpt) => (
              <TouchableOpacity
                key={filterOpt}
                style={[styles.subFilterChip, salesFilter === filterOpt && styles.subFilterChipActive]}
                onPress={() => setSalesFilter(filterOpt)}
              >
                <Text
                  style={[
                    styles.subFilterText,
                    salesFilter === filterOpt && styles.subFilterTextActive,
                  ]}
                >
                  {filterOpt === 'all' ? 'All' : filterOpt.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tab Content Display */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#B8F25C" />
            <Text style={styles.loadingText}>Syncing financial records...</Text>
          </View>
        ) : (
          <View style={styles.listFlex}>
            {/* Tab: Activity Feed */}
            {activeTab === 'activity' && (
              <FlatList
                data={activityFeed}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="inbox" size={40} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>No Financial Activity Found</Text>
                    <Text style={styles.emptySubtext}>
                      Create a sale or record an expense to begin tracking cashflow.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.activityCard}
                    activeOpacity={0.75}
                    onPress={() => {
                      if (item.type === 'sale') {
                        router.push(`/(app)/sales/${item.originalId}` as any);
                      } else {
                        router.push(`/(app)/more/expenses/${item.originalId}` as any);
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.activityIconCircle,
                        item.isMoneyIn
                          ? { backgroundColor: 'rgba(184, 242, 92, 0.15)' }
                          : { backgroundColor: 'rgba(255, 123, 114, 0.15)' },
                      ]}
                    >
                      <Feather
                        name={item.isMoneyIn ? 'arrow-down-left' : 'arrow-up-right'}
                        size={18}
                        color={item.isMoneyIn ? '#B8F25C' : '#FF7B72'}
                      />
                    </View>

                    <View style={styles.activityBody}>
                      <View style={styles.activityRowTop}>
                        <Text style={styles.activityTitle}>{item.title}</Text>
                        <MoneyText
                          amountMinor={item.amountMinor}
                          prefix={item.isMoneyIn ? '+ ' : '- '}
                          style={item.isMoneyIn ? styles.activityMoneyGreen : styles.activityMoneyRed}
                        />
                      </View>

                      <View style={styles.activityRowBottom}>
                        <Text style={styles.activityParty} numberOfLines={1}>
                          {item.party}
                        </Text>
                        <Text style={styles.activityDate}>
                          {item.date.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Tab: Sales */}
            {activeTab === 'sales' && (
              <FlatList
                data={filteredSales}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="shopping-bag" size={40} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>No Sales Found</Text>
                    <Text style={styles.emptySubtext}>Tap + Sale to record your first transaction.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.recordCard}
                    activeOpacity={0.75}
                    onPress={() => router.push(`/(app)/sales/${item.id}` as any)}
                  >
                    <View style={styles.recordHeader}>
                      <View style={styles.recordIdRow}>
                        <Feather name="file-text" size={14} color="#B8F25C" />
                        <Text style={styles.recordId}>{item.sale_number}</Text>
                      </View>
                      <MoneyText amountMinor={item.total_minor} style={styles.recordAmount} />
                    </View>

                    <View style={styles.recordFooter}>
                      <Text style={styles.recordParty} numberOfLines={1}>
                        {item.customers?.name || 'Walk-in Customer'}
                      </Text>
                      <Badge
                        label={item.payment_status.replace('_', ' ')}
                        variant={item.payment_status === 'paid' ? 'success' : 'warning'}
                      />
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Tab: Invoices */}
            {activeTab === 'invoices' && (
              <FlatList
                data={filteredInvoices}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="file-text" size={40} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>No Invoices Issued</Text>
                    <Text style={styles.emptySubtext}>Tap + Invoice to send an invoice with payment link.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.recordCard}
                    activeOpacity={0.75}
                    onPress={() => router.push(`/(app)/invoices/${item.id}` as any)}
                  >
                    <View style={styles.recordHeader}>
                      <View style={styles.recordIdRow}>
                        <Feather name="file" size={14} color="#79C0FF" />
                        <Text style={styles.recordId}>{item.invoice_number}</Text>
                      </View>
                      <MoneyText amountMinor={item.total_minor} style={styles.recordAmount} />
                    </View>

                    <View style={styles.recordFooter}>
                      <Text style={styles.recordParty} numberOfLines={1}>
                        {item.customers?.name || 'Client'}
                      </Text>
                      <Badge
                        label={item.sales?.payment_status === 'paid' ? 'Paid' : item.document_status}
                        variant={item.sales?.payment_status === 'paid' ? 'success' : item.document_status === 'issued' ? 'warning' : 'info'}
                      />
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Tab: Receipts */}
            {activeTab === 'receipts' && (
              <FlatList
                data={filteredReceipts}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="check-circle" size={40} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>No Official Receipts</Text>
                    <Text style={styles.emptySubtext}>Receipts are automatically generated when payments are confirmed.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.recordCard}
                    activeOpacity={0.75}
                    onPress={() => router.push(`/(app)/invoices/receipts/${item.id}` as any)}
                  >
                    <View style={styles.recordHeader}>
                      <View style={styles.recordIdRow}>
                        <Feather name="check-circle" size={14} color="#B8F25C" />
                        <Text style={styles.recordId}>{item.receipt_number}</Text>
                      </View>
                      <MoneyText amountMinor={item.amountMinor || item.amount_minor} style={styles.recordAmount} />
                    </View>

                    <View style={styles.recordFooter}>
                      <Text style={styles.recordParty} numberOfLines={1}>
                        {item.customer_snapshot?.name || 'Walk-in Customer'}
                      </Text>
                      <Text style={styles.receiptDate}>
                        {new Date(item.payment_occurred_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Tab: Expenses */}
            {activeTab === 'expenses' && (
              <FlatList
                data={filteredExpenses}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="credit-card" size={40} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>No Expenses Recorded</Text>
                    <Text style={styles.emptySubtext}>Tap + Expense to log operational business costs.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.recordCard}
                    activeOpacity={0.75}
                    onPress={() => router.push(`/(app)/more/expenses/${item.id}` as any)}
                  >
                    <View style={styles.recordHeader}>
                      <View style={styles.recordIdRow}>
                        <Feather name="tag" size={14} color="#FF7B72" />
                        <Text style={styles.recordId}>{item.expense_categories?.name || item.expense_number}</Text>
                      </View>
                      <MoneyText amountMinor={item.total_minor} style={styles.recordAmountRed} />
                    </View>

                    <View style={styles.recordFooter}>
                      <Text style={styles.recordParty} numberOfLines={1}>
                        {item.suppliers?.name || 'Vendor Expense'}
                      </Text>
                      <Badge
                        label={item.payment_status || item.status}
                        variant={item.payment_status === 'paid' ? 'success' : 'warning'}
                      />
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Tab: Bookkeeper */}
            {activeTab === 'bookkeeper' && (
              <ScrollView
                contentContainerStyle={styles.bookkeeperContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
              >
                <View style={styles.aiHeroCard}>
                  <View style={styles.aiHeroIconBox}>
                    <Feather name="cpu" size={24} color="#B8F25C" />
                  </View>
                  <Text style={styles.aiHeroTitle}>AI Bookkeeper Assistant</Text>
                  <Text style={styles.aiHeroSubtext}>
                    NNOO automatically classifies incoming receipts, expenses, and invoices with zero guesswork.
                  </Text>

                  <TouchableOpacity
                    style={styles.aiHeroBtn}
                    onPress={() => router.push('/(app)/intelligence/bookkeeper' as any)}
                    activeOpacity={0.85}
                  >
                    <Feather name="check-square" size={16} color="#0A1C16" />
                    <Text style={styles.aiHeroBtnText}>Open Bookkeeper Inbox</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                  <Feather name="shield" size={18} color="#B8F25C" style={{ marginRight: 10 }} />
                  <Text style={styles.infoBoxText}>
                    All financial totals are guarded by strict deterministic double-entry accounting. AI assists with classification but never mutates books without your review.
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        )}

        {/* Quick Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setActionModalVisible(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={18} color="#0A1C16" />
          <Text style={styles.fabText}>New</Text>
        </TouchableOpacity>

        {/* Modal Action Sheet */}
        <Modal
          visible={actionModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setActionModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setActionModalVisible(false)}
          >
            <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>New Transaction</Text>
              <Text style={styles.modalSubtitle}>What would you like to record?</Text>

              <View style={styles.modalOptions}>
                <TouchableOpacity
                  style={styles.modalOptionCard}
                  onPress={() => {
                    setActionModalVisible(false);
                    router.push('/(app)/sales/new' as any);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(184, 242, 92, 0.15)' }]}>
                    <Feather name="plus-circle" size={22} color="#B8F25C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalOptionTitle}>New Sale (POS)</Text>
                    <Text style={styles.modalOptionDesc}>Record instant cash, card, transfer, or credit sale</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOptionCard}
                  onPress={() => {
                    setActionModalVisible(false);
                    router.push('/(app)/more/expenses/new' as any);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Feather name="arrow-up-right" size={22} color="#F87171" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalOptionTitle}>Record Expense</Text>
                    <Text style={styles.modalOptionDesc}>Log operational spending, rent, bills, or vendor cost</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOptionCard}
                  onPress={() => {
                    setActionModalVisible(false);
                    router.push('/(app)/invoices/new' as any);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Feather name="file-text" size={22} color="#60A5FA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalOptionTitle}>Issue Customer Invoice</Text>
                    <Text style={styles.modalOptionDesc}>Create bill for client with due date and payment terms</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setActionModalVisible(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
    paddingTop: 18,
    paddingBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(184, 242, 92, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 8,
  },
  tagText: {
    color: '#B8F25C',
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#B8F25C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    color: '#0A1C16',
    fontWeight: '700',
    fontSize: 12,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  secondaryActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  kpiScrollView: {
    flexGrow: 0,
    marginBottom: 8,
  },
  kpiContainer: {
    paddingHorizontal: 18,
    gap: 8,
    alignItems: 'flex-start',
  },
  kpiCard: {
    width: 146,
    backgroundColor: 'rgba(20, 54, 40, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiMoneyGreen: {
    fontSize: 15,
    fontWeight: '900',
    color: '#B8F25C',
  },
  kpiMoneyRed: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FF7B72',
  },
  kpiMoneyOrange: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F0883E',
  },
  kpiSubtext: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
  },
  tabsScrollView: {
    flexGrow: 0,
    marginBottom: 8,
  },
  tabsContainer: {
    paddingHorizontal: 18,
    gap: 6,
    alignItems: 'center',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(184, 242, 92, 0.16)',
    borderColor: '#B8F25C',
    borderWidth: 1.5,
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#B8F25C',
    fontWeight: '800',
  },
  tabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: '#B8F25C',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabBadgeTextActive: {
    color: '#0A1C16',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginHorizontal: 18,
    paddingHorizontal: 14,
    borderRadius: 14,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  clearSearchBtn: {
    padding: 4,
  },
  subFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 10,
  },
  subFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  subFilterChipActive: {
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.35)',
  },
  subFilterText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  subFilterTextActive: {
    color: '#B8F25C',
    fontWeight: '700',
  },
  listFlex: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 10,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 54, 40, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  activityIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityBody: {
    flex: 1,
  },
  activityRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activityMoneyGreen: {
    fontSize: 15,
    fontWeight: '900',
    color: '#B8F25C',
  },
  activityMoneyRed: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FF7B72',
  },
  activityRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityParty: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    flex: 1,
    marginRight: 8,
  },
  activityDate: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  recordCard: {
    backgroundColor: 'rgba(20, 54, 40, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recordIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recordAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B8F25C',
  },
  recordAmountRed: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF7B72',
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordParty: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    flex: 1,
    marginRight: 8,
  },
  receiptDate: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  bookkeeperContainer: {
    padding: 16,
    gap: 16,
  },
  aiHeroCard: {
    backgroundColor: 'rgba(20, 54, 40, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.3)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  aiHeroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  aiHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  aiHeroSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  aiHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B8F25C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  aiHeroBtnText: {
    color: '#0A1C16',
    fontSize: 13,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
  /* Floating Action Button */
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#B8F25C',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  fabText: {
    color: '#0A1C16',
    fontWeight: '900',
    fontSize: 14,
  },
  /* Action Sheet Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0E2920',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    marginBottom: 20,
  },
  modalOptions: {
    gap: 12,
    marginBottom: 16,
  },
  modalOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOptionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  modalCancelBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    fontSize: 14,
  },
});
