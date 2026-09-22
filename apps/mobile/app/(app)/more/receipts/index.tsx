import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { MoneyText } from '../../../../components/MoneyText';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ReceiptsHubScreen() {
  const { activeBusiness } = useBusiness();
  const router = useRouter();

  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchReceipts = async () => {
    if (!activeBusiness) return;
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          id,
          receipt_number,
          amount_minor,
          currency_code,
          payment_occurred_at,
          payment_method_snapshot,
          customer_snapshot,
          sale_number_snapshot,
          created_at
        `)
        .eq('business_id', activeBusiness.id)
        .order('payment_occurred_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setReceipts(data || []);
    } catch (err) {
      console.error('ReceiptsHub: error loading receipts', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReceipts();
    }, [activeBusiness])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReceipts();
    setRefreshing(false);
  };

  const totalReceiptsMinor = useMemo(() => {
    return receipts.reduce((sum, r) => sum + (parseInt(r.amount_minor, 10) || 0), 0);
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    if (!search.trim()) return receipts;
    const query = search.toLowerCase();
    return receipts.filter((r) => {
      const custName = r.customer_snapshot?.name || '';
      return (
        r.receipt_number?.toLowerCase().includes(query) ||
        custName.toLowerCase().includes(query) ||
        r.sale_number_snapshot?.toLowerCase().includes(query)
      );
    });
  }, [receipts, search]);

  const handleShare = async (receipt: any) => {
    try {
      const customerName = receipt.customer_snapshot?.name || 'Walk-in Customer';
      const amount = (parseInt(receipt.amount_minor, 10) / 100).toFixed(2);
      const currency = receipt.currency_code || 'NGN';
      const text =
        `OFFICIAL PAYMENT RECEIPT\n` +
        `---------------------------\n` +
        `Receipt #: ${receipt.receipt_number}\n` +
        `Business: ${activeBusiness?.name}\n` +
        `Customer: ${customerName}\n` +
        `Order Ref: ${receipt.sale_number_snapshot || 'Direct'}\n` +
        `Amount Paid: ${currency} ${amount}\n` +
        `Date: ${new Date(receipt.payment_occurred_at).toLocaleDateString()}\n` +
        `---------------------------\n` +
        `Thank you for your business!`;

      await Share.share({
        message: text,
        title: `Receipt ${receipt.receipt_number}`,
      });
    } catch (err) {
      console.error('Error sharing receipt', err);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A1C16', '#0F261E', '#0A1C16']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.tag}>
              <Feather name="check-circle" size={12} color="#B8F25C" />
              <Text style={styles.tagText}>Audit-Proof Invoices & Sales</Text>
            </View>
          </View>
          <Text style={styles.title}>Official Receipts</Text>
          <Text style={styles.subtitle}>Verified payment records generated for customer orders</Text>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Receipts</Text>
              <Text style={styles.metricValue}>{receipts.length}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Collected</Text>
              <MoneyText amountMinor={totalReceiptsMinor} style={styles.metricMoney} />
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by receipt number, customer, or order..."
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

        {/* List */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#B8F25C" />
            <Text style={styles.loadingText}>Loading payment receipts...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredReceipts}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="check-circle" size={40} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyTitle}>No Receipts Found</Text>
                <Text style={styles.emptySubtext}>
                  Receipts are automatically issued whenever a sale or invoice payment is confirmed.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.receiptCard}>
                <TouchableOpacity
                  style={styles.cardMain}
                  activeOpacity={0.75}
                  onPress={() => router.push(`/(app)/invoices/receipts/${item.id}` as any)}
                >
                  <View style={styles.receiptHeader}>
                    <View style={styles.receiptIdBox}>
                      <Feather name="file-text" size={14} color="#B8F25C" />
                      <Text style={styles.receiptNumber}>{item.receipt_number}</Text>
                    </View>
                    <MoneyText amountMinor={item.amount_minor} style={styles.receiptAmount} />
                  </View>

                  <View style={styles.receiptDetails}>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {item.customer_snapshot?.name || 'Walk-in Customer'}
                    </Text>
                    <Text style={styles.receiptDate}>
                      {new Date(item.payment_occurred_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleShare(item)}
                  >
                    <Feather name="share-2" size={13} color="#B8F25C" />
                    <Text style={styles.actionBtnText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/(app)/invoices/receipts/${item.id}` as any)}
                  >
                    <Feather name="eye" size={13} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.actionBtnText}>View Receipt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
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
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(184, 242, 92, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    color: '#B8F25C',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
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
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 54, 40, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metricMoney: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B8F25C',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 18,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 40,
    marginBottom: 10,
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
  receiptCard: {
    backgroundColor: 'rgba(20, 54, 40, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 12,
  },
  cardMain: {},
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  receiptIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  receiptAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B8F25C',
  },
  receiptDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    flex: 1,
    marginRight: 8,
  },
  receiptDate: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
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
});
