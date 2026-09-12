import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { MoneyText } from '../../../../components/MoneyText';

export default function InventoryReportScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInventory = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_positions')
        .select(`
          id,
          quantity_on_hand,
          inventory_value_minor,
          status,
          catalog_items (
            id,
            name,
            sku,
            unit_code,
            cost_price_minor,
            selling_price_minor,
            track_inventory
          )
        `)
        .eq('business_id', activeBusiness.id)
        .order('inventory_value_minor', { ascending: false });

      if (error) throw error;

      const tracked = (data || []).filter(
        (p: any) => p.catalog_items?.track_inventory !== false
      );
      setPositions(tracked);
    } catch (err: any) {
      console.error('Error fetching inventory report:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInventory();
    }, [activeBusiness])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
  };

  const totalValueMinor = positions.reduce(
    (sum, p) => sum + (parseInt(p.inventory_value_minor, 10) || 0),
    0
  );

  const totalItemsCount = positions.reduce(
    (sum, p) => sum + (parseFloat(p.quantity_on_hand) || 0),
    0
  );

  const renderItem = ({ item }: { item: any }) => {
    const catalogItem = item.catalog_items;
    const qty = parseFloat(item.quantity_on_hand || '0');
    const unit = catalogItem?.unit_code || 'units';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/inventory/${item.id}` as any)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.itemName}>{catalogItem?.name || 'Item'}</Text>
          <MoneyText amountMinor={item.inventory_value_minor} style={styles.price} />
        </View>

        <View style={styles.cardMid}>
          <Text style={styles.skuText}>
            {catalogItem?.sku ? `SKU: ${catalogItem.sku}` : 'No SKU'}
          </Text>
          <Text style={styles.qtyText}>
            {qty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {unit}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Inventory Valuation</Text>
          <Text style={styles.subtext}>Asset value of current on-hand stock</Text>
        </View>
      </View>

      {/* Summary Banner */}
      <View style={styles.summaryBanner}>
        <View>
          <Text style={styles.summaryLabel}>Total Stock Asset Value</Text>
          <MoneyText amountMinor={totalValueMinor} style={styles.summaryAmount} />
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summarySubLabel}>Tracked SKUs</Text>
          <Text style={styles.summaryCount}>{positions.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#B8F25C" />
        </View>
      ) : (
        <FlatList
          data={positions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#B8F25C"
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="box" size={36} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No inventory positions tracked.</Text>
            </View>
          }
        />
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
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: { marginRight: 14, padding: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  summaryBanner: {
    backgroundColor: '#0E291E',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
  },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 4 },
  summaryAmount: { fontSize: 24, fontWeight: '900', color: '#B8F25C' },
  summaryRight: { alignItems: 'flex-end' },
  summarySubLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  summaryCount: { fontSize: 18, fontWeight: '800', color: '#FFF' },

  listContent: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 60 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: { fontSize: 15, fontWeight: '800', color: '#FFF', flex: 1, marginRight: 8 },
  price: { fontSize: 16, fontWeight: '900', color: '#B8F25C' },
  cardMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  skuText: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  qtyText: { fontSize: 14, color: '#FFF', fontWeight: '700' },

  emptyContainer: { padding: 48, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
});
