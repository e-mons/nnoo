import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { Feather } from '@expo/vector-icons';

export default function InventoryIndexScreen() {
  const { activeBusiness } = useBusiness();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'uninitialized'>('all');

  const fetchInventory = async () => {
    if (!activeBusiness) return;
    try {
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
            low_stock_threshold,
            track_inventory
          )
        `)
        .eq('business_id', activeBusiness.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const tracked = (data || []).filter((p: any) => p.catalog_items?.track_inventory !== false);
      setItems(tracked);
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
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
    setRefreshing(false);
  };

  const filteredItems = items.filter((item) => {
    const catalogItem = item.catalog_items;
    const name = catalogItem?.name?.toLowerCase() || '';
    const sku = catalogItem?.sku?.toLowerCase() || '';
    const q = search.toLowerCase();
    const matchesSearch = name.includes(q) || sku.includes(q);

    const threshold = catalogItem?.low_stock_threshold ?? 0;
    const qty = parseFloat(item.quantity_on_hand || '0');
    const isLowStock = threshold > 0 && qty <= threshold;
    const isUninitialized = item.status === 'pending_initialization';

    if (filter === 'low_stock') return matchesSearch && isLowStock;
    if (filter === 'uninitialized') return matchesSearch && isUninitialized;
    return matchesSearch;
  });

  const renderItem = ({ item }: { item: any }) => {
    const catalogItem = item.catalog_items;
    const threshold = catalogItem?.low_stock_threshold ?? 0;
    const qty = parseFloat(item.quantity_on_hand || '0');
    const isLowStock = threshold > 0 && qty <= threshold;
    const isPending = item.status === 'pending_initialization';
    const unit = catalogItem?.unit_code || 'units';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/inventory/${item.id}` as any)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.itemName}>{catalogItem?.name || 'Unnamed Item'}</Text>
          {isPending ? (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Needs Setup</Text>
            </View>
          ) : isLowStock ? (
            <View style={styles.warningBadge}>
              <Text style={styles.warningText}>Low Stock</Text>
            </View>
          ) : (
            <View style={styles.okBadge}>
              <Text style={styles.okText}>In Stock</Text>
            </View>
          )}
        </View>

        <Text style={styles.sku}>{catalogItem?.sku ? `SKU: ${catalogItem.sku}` : 'No SKU'}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.quantity}>
            {isPending ? '0.00' : qty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {unit}
          </Text>
          <View style={styles.chevronBox}>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.4)" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtext}>Track real-time stock levels & positions</Text>
        </View>
        <TouchableOpacity
          style={styles.receiptsButton}
          onPress={() => router.push('/(app)/inventory/receipts/' as any)}
          activeOpacity={0.8}
        >
          <Feather name="truck" size={16} color="#B8F25C" />
          <Text style={styles.receiptsButtonText}>Receipts</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stock by product or SKU..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'All Items' },
            { key: 'low_stock', label: 'Low Stock' },
            { key: 'uninitialized', label: 'Needs Setup' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                filter === f.key && styles.filterChipActive,
              ]}
              onPress={() => setFilter(f.key as any)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === f.key && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="box" size={36} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No inventory items tracked.</Text>
            <Text style={styles.emptySubtext}>
              Enable inventory tracking on your products in More → Products & Services.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/inventory/receipts/new' as any)}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={28} color="#0A1C16" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  receiptsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(184, 242, 92, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.3)',
  },
  receiptsButtonText: { color: '#B8F25C', fontWeight: '800', fontSize: 13 },

  searchSection: { paddingHorizontal: 24, marginTop: 12, marginBottom: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 10,
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 14 },

  filterRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  filterChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  filterChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { color: '#0A1C16' },

  listContent: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 130 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', flex: 1, marginRight: 8 },
  sku: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quantity: { fontSize: 18, fontWeight: '900', color: '#B8F25C' },
  chevronBox: { padding: 4 },

  warningBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderColor: '#F59E0B',
    borderWidth: 1,
  },
  warningText: { color: '#F59E0B', fontSize: 11, fontWeight: 'bold' },

  pendingBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderColor: '#3B82F6',
    borderWidth: 1,
  },
  pendingText: { color: '#60A5FA', fontSize: 11, fontWeight: 'bold' },

  okBadge: {
    backgroundColor: 'rgba(184, 242, 92, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderColor: 'rgba(184, 242, 92, 0.3)',
    borderWidth: 1,
  },
  okText: { color: '#B8F25C', fontSize: 11, fontWeight: 'bold' },

  emptyContainer: { padding: 48, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '700' },
  emptySubtext: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', lineHeight: 18 },

  fab: {
    position: 'absolute',
    bottom: 96,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#B8F25C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
});
