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
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { MoneyText } from '../../../components/MoneyText';
import { Badge } from '../../../components/Badge';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type StockTab = 'items' | 'inventory' | 'adjustments' | 'low-stock';

export default function StockHubScreen() {
  const { activeBusiness } = useBusiness();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<StockTab>('items');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  const [actionModalVisible, setActionModalVisible] = useState(false);

  // Data sets
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  const fetchStockData = async () => {
    if (!activeBusiness) return;
    try {
      const [catalogRes, positionsRes] = await Promise.all([
        supabase
          .from('catalog_items')
          .select(`
            id,
            name,
            sku,
            barcode,
            item_type,
            selling_price_minor,
            cost_price_minor,
            unit_code,
            track_inventory,
            low_stock_threshold,
            status,
            product_categories ( id, name )
          `)
          .eq('business_id', activeBusiness.id)
          .order('name', { ascending: true }),
        supabase
          .from('inventory_positions')
          .select(`
            id,
            catalog_item_id,
            quantity_on_hand,
            inventory_value_minor,
            status,
            created_at
          `)
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false }),
      ]);

      if (catalogRes.error) console.error('Error fetching catalog:', catalogRes.error);
      if (positionsRes.error) console.error('Error fetching positions:', positionsRes.error);

      setCatalogItems(catalogRes.data || []);
      setPositions(positionsRes.data || []);
    } catch (err) {
      console.error('StockHub: error loading stock data', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStockData();
    }, [activeBusiness])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStockData();
    setRefreshing(false);
  };

  // Merged items with positions
  const mergedItems = useMemo(() => {
    const positionMap = new Map<string, any>();
    positions.forEach((pos) => {
      if (pos.catalog_item_id) {
        positionMap.set(pos.catalog_item_id, pos);
      }
    });

    return catalogItems.map((item) => {
      const position = positionMap.get(item.id);
      const qty = position ? parseFloat(position.quantity_on_hand) || 0 : 0;
      const isPending = position?.status === 'pending_initialization';
      const threshold = item.low_stock_threshold ?? 5;
      const isLowStock = item.track_inventory && qty <= threshold;
      const isOutOfStock = item.track_inventory && qty <= 0;

      return {
        ...item,
        position,
        quantityOnHand: qty,
        isPending,
        isLowStock,
        isOutOfStock,
      };
    });
  }, [catalogItems, positions]);

  // KPIs
  const totalStockValueMinor = useMemo(() => {
    return positions
      .filter((p) => p.status === 'initialized')
      .reduce((sum, p) => sum + (parseInt(p.inventory_value_minor, 10) || 0), 0);
  }, [positions]);

  const totalTrackedUnits = useMemo(() => {
    return positions
      .filter((p) => p.status === 'initialized')
      .reduce((sum, p) => sum + (parseFloat(p.quantity_on_hand) || 0), 0);
  }, [positions]);

  const lowStockCount = useMemo(() => {
    return mergedItems.filter((i) => i.isLowStock || i.isPending).length;
  }, [mergedItems]);

  // Filtered Items (Catalog)
  const filteredCatalogItems = useMemo(() => {
    return mergedItems.filter((item) => {
      const query = search.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        (item.sku && item.sku.toLowerCase().includes(query)) ||
        (item.barcode && item.barcode.toLowerCase().includes(query));

      const matchesType =
        itemTypeFilter === 'all' || item.item_type === itemTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [mergedItems, search, itemTypeFilter]);

  // Filtered Live Inventory Positions
  const filteredPositions = useMemo(() => {
    return mergedItems
      .filter((i) => i.track_inventory)
      .filter((item) => {
        const query = search.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          (item.sku && item.sku.toLowerCase().includes(query))
        );
      });
  }, [mergedItems, search]);

  // Low Stock Items
  const lowStockItems = useMemo(() => {
    return mergedItems.filter((i) => i.isLowStock || i.isPending);
  }, [mergedItems]);

  const tabs: { key: StockTab; label: string; count?: number }[] = [
    { key: 'items', label: 'Products & Items', count: catalogItems.length },
    { key: 'low-stock', label: 'Low Stock Urgencies', count: lowStockCount },
    { key: 'adjustments', label: 'Stock In & Out' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A1C16', '#0F261E', '#0A1C16']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.tag}>
              <Feather name="box" size={12} color="#B8F25C" />
              <Text style={styles.tagText}>Stock & Products Hub</Text>
            </View>
            <Text style={styles.title}>Items & Stock</Text>
            <Text style={styles.subtitle}>Products, physical counts on hand, and reorders</Text>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => setActionModalVisible(true)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={16} color="#0A1C16" />
              <Text style={styles.primaryActionBtnText}>+ Action</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => router.push('/(app)/more/products/new' as any)}
              activeOpacity={0.8}
            >
              <Feather name="plus-circle" size={14} color="#B8F25C" />
              <Text style={styles.secondaryActionBtnText}>Product</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => router.push('/(app)/inventory/receipts/new' as any)}
              activeOpacity={0.8}
            >
              <Feather name="download" size={14} color="#79C0FF" />
              <Text style={styles.secondaryActionBtnText}>Receive</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stock KPIs Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.kpiScrollView}
          contentContainerStyle={styles.kpiContainer}
        >
          {/* Total Stock Value */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Total Stock Value</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(184, 242, 92, 0.15)' }]}>
                <Feather name="pie-chart" size={14} color="#B8F25C" />
              </View>
            </View>
            <MoneyText amountMinor={totalStockValueMinor} style={styles.kpiMoneyGreen} />
            <Text style={styles.kpiSubtext}>Total inventory asset</Text>
          </View>

          {/* Total Units on Hand */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Items on Hand</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(121, 192, 255, 0.15)' }]}>
                <Feather name="package" size={14} color="#79C0FF" />
              </View>
            </View>
            <Text style={styles.kpiValueBlue}>{totalTrackedUnits.toLocaleString()}</Text>
            <Text style={styles.kpiSubtext}>Physical units counted</Text>
          </View>

          {/* Low Stock Alerts */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Low Stock Alerts</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(255, 123, 114, 0.15)' }]}>
                <Feather name="alert-triangle" size={14} color="#FF7B72" />
              </View>
            </View>
            <Text style={[styles.kpiValueRed, lowStockCount === 0 ? { color: '#B8F25C' } : null]}>
              {lowStockCount}
            </Text>
            <Text style={styles.kpiSubtext}>{lowStockCount === 0 ? 'All items in stock' : 'Needs urgent restock'}</Text>
          </View>

          {/* Total Catalog Items */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Total Products</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(240, 136, 62, 0.15)' }]}>
                <Feather name="layers" size={14} color="#F0883E" />
              </View>
            </View>
            <Text style={styles.kpiValueOrange}>{catalogItems.length}</Text>
            <Text style={styles.kpiSubtext}>Catalog offerings</Text>
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

        {/* Search Bar (except for adjustments tab) */}
        {activeTab !== 'adjustments' && (
          <View style={styles.searchSection}>
            <Feather name="search" size={16} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search items by name, SKU or barcode...`}
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

        {/* Filter chips for Catalog Items */}
        {activeTab === 'items' && (
          <View style={styles.subFilterRow}>
            {(['all', 'product', 'service'] as const).map((filterOpt) => (
              <TouchableOpacity
                key={filterOpt}
                style={[styles.subFilterChip, itemTypeFilter === filterOpt && styles.subFilterChipActive]}
                onPress={() => setItemTypeFilter(filterOpt)}
              >
                <Text
                  style={[
                    styles.subFilterText,
                    itemTypeFilter === filterOpt && styles.subFilterTextActive,
                  ]}
                >
                  {filterOpt === 'all' ? 'All Items' : `${filterOpt}s`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tab Content Display */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#B8F25C" />
            <Text style={styles.loadingText}>Syncing stock & inventory records...</Text>
          </View>
        ) : (
          <View style={styles.listFlex}>
            {/* Tab: Items & Products Catalog */}
            {activeTab === 'items' && (
              <FlatList
                data={filteredCatalogItems}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="box" size={40} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>No Catalog Items Found</Text>
                    <Text style={styles.emptySubtext}>Tap + Item to add your first product or service.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.stockCard}
                    activeOpacity={0.75}
                    onPress={() => router.push(`/(app)/more/products/${item.id}` as any)}
                  >
                    <View style={styles.stockCardHeader}>
                      <View style={styles.stockNameCol}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.skuRow}>
                          <Text style={styles.skuText}>SKU: {item.sku || 'N/A'}</Text>
                          {item.product_categories && (
                            <Text style={styles.categoryBadgeText}>
                              • {item.product_categories.name}
                            </Text>
                          )}
                        </View>
                      </View>
                      <MoneyText amountMinor={item.selling_price_minor} style={styles.itemPrice} />
                    </View>

                    <View style={styles.stockCardFooter}>
                      <View style={styles.stockMetaRow}>
                        <Feather
                          name={item.item_type === 'service' ? 'activity' : 'package'}
                          size={12}
                          color="rgba(255,255,255,0.4)"
                        />
                        <Text style={styles.stockMetaText}>
                          {item.item_type === 'service' ? 'Service' : `${item.quantityOnHand} ${item.unit_code || 'units'}`}
                        </Text>
                      </View>

                      {item.track_inventory ? (
                        item.isPending ? (
                          <Badge label="Needs Init" variant="warning" />
                        ) : item.isOutOfStock ? (
                          <Badge label="Out of Stock" variant="error" />
                        ) : item.isLowStock ? (
                          <Badge label="Low Stock" variant="warning" />
                        ) : (
                          <Badge label="In Stock" variant="success" />
                        )
                      ) : (
                        <Badge label="Untracked" variant="info" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Tab: Live Stock Positions */}
            {activeTab === 'inventory' && (
              <FlatList
                data={filteredPositions}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="layers" size={40} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>No Tracked Inventory Positions</Text>
                    <Text style={styles.emptySubtext}>Enable inventory tracking on items to view positions.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.stockCard}
                    activeOpacity={0.75}
                    onPress={() => {
                      if (item.position?.id) {
                        router.push(`/(app)/inventory/${item.position.id}` as any);
                      }
                    }}
                  >
                    <View style={styles.stockCardHeader}>
                      <View style={styles.stockNameCol}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.skuText}>SKU: {item.sku || 'N/A'}</Text>
                      </View>
                      <View style={styles.qtyBox}>
                        <Text style={styles.qtyNumber}>{item.quantityOnHand}</Text>
                        <Text style={styles.qtyUnit}>{item.unit_code || 'units'}</Text>
                      </View>
                    </View>

                    <View style={styles.stockCardFooter}>
                      <View style={styles.stockMetaRow}>
                        <Text style={styles.stockMetaText}>Valuation: </Text>
                        <MoneyText
                          amountMinor={item.position?.inventory_value_minor || 0}
                          style={styles.stockValueMoney}
                        />
                      </View>

                      {item.isPending ? (
                        <Badge label="Needs Init" variant="warning" />
                      ) : item.isOutOfStock ? (
                        <Badge label="0 Stock" variant="error" />
                      ) : item.isLowStock ? (
                        <Badge label="Low Stock" variant="warning" />
                      ) : (
                        <Badge label="Healthy" variant="success" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Tab: Low Stock Alerts */}
            {activeTab === 'low-stock' && (
              <FlatList
                data={lowStockItems}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="check-circle" size={40} color="#B8F25C" />
                    <Text style={styles.emptyTitle}>All Stock Levels Healthy</Text>
                    <Text style={styles.emptySubtext}>No items are below their reorder threshold.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.stockCard, { borderColor: 'rgba(255, 123, 114, 0.3)' }]}
                    activeOpacity={0.75}
                    onPress={() => router.push('/(app)/inventory/receive' as any)}
                  >
                    <View style={styles.stockCardHeader}>
                      <View style={styles.stockNameCol}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.skuText}>SKU: {item.sku || 'N/A'}</Text>
                      </View>
                      <View style={styles.qtyBoxRed}>
                        <Text style={styles.qtyNumberRed}>{item.quantityOnHand}</Text>
                        <Text style={styles.qtyUnit}>{item.unit_code || 'units'}</Text>
                      </View>
                    </View>

                    <View style={styles.stockCardFooter}>
                      <Text style={styles.reorderText}>
                        Threshold: {item.low_stock_threshold ?? 5} units
                      </Text>
                      <TouchableOpacity
                        style={styles.quickReceiveBtn}
                        onPress={() => router.push('/(app)/inventory/receive' as any)}
                      >
                        <Feather name="download" size={12} color="#0A1C16" />
                        <Text style={styles.quickReceiveBtnText}>Restock</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Tab: Stock Movements & Actions */}
            {activeTab === 'adjustments' && (
              <ScrollView
                contentContainerStyle={styles.movementsContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
              >
                <View style={styles.movementActionCard}>
                  <View style={styles.movementActionHeader}>
                    <View style={[styles.movementIconBox, { backgroundColor: 'rgba(184, 242, 92, 0.15)' }]}>
                      <Feather name="download" size={20} color="#B8F25C" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.movementActionTitle}>Receive Supplier Stock</Text>
                      <Text style={styles.movementActionDesc}>
                        Record purchased items and update inventory quantities and unit costs.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.movementBtnPrimary}
                    onPress={() => router.push('/(app)/inventory/receive' as any)}
                  >
                    <Text style={styles.movementBtnPrimaryText}>Receive Stock Now</Text>
                    <Feather name="arrow-right" size={14} color="#0A1C16" />
                  </TouchableOpacity>
                </View>

                <View style={styles.movementActionCard}>
                  <View style={styles.movementActionHeader}>
                    <View style={[styles.movementIconBox, { backgroundColor: 'rgba(121, 192, 255, 0.15)' }]}>
                      <Feather name="file-text" size={20} color="#79C0FF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.movementActionTitle}>Goods Received Notes</Text>
                      <Text style={styles.movementActionDesc}>
                        View history of all supplier stock intakes and delivery receipts.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.movementBtnSecondary}
                    onPress={() => router.push('/(app)/inventory/receipts' as any)}
                  >
                    <Text style={styles.movementBtnSecondaryText}>View Received Notes</Text>
                    <Feather name="arrow-right" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
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
              <Text style={styles.modalTitle}>Stock Actions</Text>
              <Text style={styles.modalSubtitle}>Manage your products and inventory</Text>

              <View style={styles.modalOptions}>
                <TouchableOpacity
                  style={styles.modalOptionCard}
                  onPress={() => {
                    setActionModalVisible(false);
                    router.push('/(app)/more/products/new' as any);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(184, 242, 92, 0.15)' }]}>
                    <Feather name="plus-circle" size={22} color="#B8F25C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalOptionTitle}>Add New Product</Text>
                    <Text style={styles.modalOptionDesc}>Add a new item, barcode, selling price, and cost</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOptionCard}
                  onPress={() => {
                    setActionModalVisible(false);
                    router.push('/(app)/inventory/receipts/new' as any);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(121, 192, 255, 0.15)' }]}>
                    <Feather name="download" size={22} color="#79C0FF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalOptionTitle}>Receive Stock Shipment</Text>
                    <Text style={styles.modalOptionDesc}>Record supplier delivery note and increase stock counts</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOptionCard}
                  onPress={() => {
                    setActionModalVisible(false);
                    router.push('/(app)/inventory/receipts' as any);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(240, 136, 62, 0.15)' }]}>
                    <Feather name="file-text" size={22} color="#F0883E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalOptionTitle}>Goods Received Notes</Text>
                    <Text style={styles.modalOptionDesc}>Browse previous stock delivery receipts</Text>
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
  kpiValueBlue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#79C0FF',
  },
  kpiValueRed: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FF7B72',
  },
  kpiValueOrange: {
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
  stockCard: {
    backgroundColor: 'rgba(20, 54, 40, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  stockCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  stockNameCol: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skuText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  categoryBadgeText: {
    fontSize: 11,
    color: 'rgba(184, 242, 92, 0.7)',
    marginLeft: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B8F25C',
  },
  stockCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  stockMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stockMetaText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  stockValueMoney: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  qtyBox: {
    alignItems: 'flex-end',
  },
  qtyNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#79C0FF',
  },
  qtyUnit: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  qtyBoxRed: {
    alignItems: 'flex-end',
  },
  qtyNumberRed: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF7B72',
  },
  reorderText: {
    fontSize: 11,
    color: 'rgba(255, 123, 114, 0.8)',
    fontWeight: '600',
  },
  quickReceiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#B8F25C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickReceiveBtnText: {
    color: '#0A1C16',
    fontSize: 11,
    fontWeight: '700',
  },
  movementsContainer: {
    padding: 16,
    gap: 14,
  },
  movementActionCard: {
    backgroundColor: 'rgba(20, 54, 40, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
  },
  movementActionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  movementIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movementActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  movementActionDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  movementBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B8F25C',
    paddingVertical: 10,
    borderRadius: 12,
  },
  movementBtnPrimaryText: {
    color: '#0A1C16',
    fontSize: 13,
    fontWeight: '700',
  },
  movementBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  movementBtnSecondaryText: {
    color: '#FFFFFF',
    fontSize: 13,
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
