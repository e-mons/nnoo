import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Badge } from '../../../../components/Badge';
import { MoneyText } from '../../../../components/MoneyText';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function ProductsIndexScreen() {
  const { activeBusiness } = useBusiness();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'product' | 'service' | 'tracked'>('all');
  const router = useRouter();

  const fetchItems = async () => {
    if (!activeBusiness) return;
    try {
      let query = supabase
        .from('catalog_items')
        .select('*, product_categories(name)')
        .eq('business_id', activeBusiness.id)
        .order('name', { ascending: true })
        .limit(100);

      if (searchQuery.trim() !== '') {
        const sq = searchQuery.trim();
        query = query.or(`name.ilike.%${sq}%,sku.ilike.%${sq}%,barcode.ilike.%${sq}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching catalog items', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [activeBusiness, searchQuery])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'product') return item.item_type === 'product';
    if (filter === 'service') return item.item_type === 'service';
    if (filter === 'tracked') return item.track_inventory;
    return true;
  });

  const renderItem = ({ item }: { item: any }) => {
    const isService = item.item_type === 'service';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/more/products/${item.id}` as any)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Feather
              name={isService ? 'tool' : 'package'}
              size={20}
              color={isService ? '#FF9800' : '#B8F25C'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <MoneyText
                amountMinor={item.selling_price_minor}
                style={styles.price}
              />
            </View>
            <View style={styles.skuRow}>
              {item.sku ? <Text style={styles.skuText}>SKU: {item.sku}</Text> : null}
              {item.sku && item.barcode ? <Text style={styles.dot}>•</Text> : null}
              {item.barcode ? <Text style={styles.skuText}>Bar: {item.barcode}</Text> : null}
              {!item.sku && !item.barcode ? (
                <Text style={styles.skuText}>Unit: {item.unit_code?.toUpperCase() || 'ITEM'}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.tagRow}>
            <Badge
              label={item.item_type?.toUpperCase()}
              variant={item.item_type === 'product' ? 'success' : 'warning'}
            />
            {item.product_categories?.name ? (
              <Badge label={item.product_categories.name} variant="default" />
            ) : null}
            {item.track_inventory ? (
              <Badge label="Inventory Tracked" variant="info" />
            ) : null}
          </View>

          <Badge
            label={item.status}
            variant={item.status === 'active' ? 'success' : 'default'}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Products & Services</Text>
          <Text style={styles.subtext}>Product catalog & services</Text>
        </View>
        <TouchableOpacity
          style={styles.categoriesButton}
          onPress={() => router.push('/(app)/more/products/categories' as any)}
        >
          <Feather name="tag" size={15} color="#B8F25C" />
          <Text style={styles.categoriesButtonText}>Categories</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, SKU, barcode..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {[
            { key: 'all', label: `All (${items.length})` },
            { key: 'product', label: 'Products' },
            { key: 'service', label: 'Services' },
            { key: 'tracked', label: 'Stock Tracked' },
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

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#B8F25C" />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
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
              <Feather name="package" size={36} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No catalog items found.</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add products or billable services.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/more/products/new' as any)}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={28} color="#0A1C16" />
      </TouchableOpacity>
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
    paddingBottom: 12,
  },
  backButton: {
    marginRight: 14,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
  categoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(184,242,92,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(184,242,92,0.25)',
  },
  categoriesButtonText: {
    color: '#B8F25C',
    fontSize: 13,
    fontWeight: '700',
  },

  searchSection: { paddingHorizontal: 20, marginTop: 6, marginBottom: 10 },
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

  listContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 130 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  price: { fontSize: 16, fontWeight: '900', color: '#B8F25C' },

  skuRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  skuText: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  dot: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  tagRow: { flexDirection: 'row', gap: 6 },

  emptyContainer: { padding: 48, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '700' },
  emptySubtext: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' },

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
