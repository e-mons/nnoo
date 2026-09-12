import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { createStockReceiptSchema } from '@nnoo/validation';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';

interface CatalogItem {
  id: string;
  name: string;
  sku: string | null;
  unit_code: string;
  cost_price_minor: string | number | null;
  track_inventory: boolean;
}

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface ReceiptLineDraft {
  id: string;
  catalogItem: CatalogItem;
  quantity: string;
  unitCostMinor: string;
}

export default function NewStockReceiptScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Form State
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierReference, setSupplierReference] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<ReceiptLineDraft[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos' | 'bank_transfer' | 'unpaid'>('cash');
  const [itemSearch, setItemSearch] = useState('');

  // Modals
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');

  const currencyCode = (activeBusiness as any)?.currency_code || 'NGN';

  const formatMoney = (minor: number) => {
    return `${currencyCode} ${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    const loadDependencies = async () => {
      if (!activeBusiness) return;
      try {
        setFetching(true);
        const [itemsRes, supRes] = await Promise.all([
          supabase
            .from('catalog_items')
            .select('id, name, sku, unit_code, cost_price_minor, track_inventory')
            .eq('business_id', activeBusiness.id)
            .eq('track_inventory', true)
            .eq('item_type', 'product')
            .order('name'),
          supabase
            .from('suppliers')
            .select('id, name, phone, email')
            .eq('business_id', activeBusiness.id)
            .order('name'),
        ]);

        if (itemsRes.error) throw itemsRes.error;
        if (supRes.error) throw supRes.error;

        setCatalogItems(itemsRes.data || []);
        setSuppliers(supRes.data || []);
      } catch (err: any) {
        console.error('Error fetching stock receipt dependencies:', err);
        Alert.alert('Error', 'Failed to load tracked items and suppliers.');
      } finally {
        setFetching(false);
      }
    };

    loadDependencies();
  }, [activeBusiness]);

  const addToCart = (item: CatalogItem) => {
    const existingIndex = cart.findIndex((c) => c.catalogItem.id === item.id);
    if (existingIndex >= 0) {
      const updated = [...cart];
      const currentQty = parseFloat(updated[existingIndex].quantity) || 0;
      updated[existingIndex].quantity = (currentQty + 1).toString();
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          id: Crypto.randomUUID(),
          catalogItem: item,
          quantity: '1',
          unitCostMinor: (item.cost_price_minor || '0').toString(),
        },
      ]);
    }
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id === id) {
            const current = parseFloat(c.quantity) || 0;
            const next = Math.max(0, current + delta);
            return { ...c, quantity: next.toString() };
          }
          return c;
        })
        .filter((c) => parseFloat(c.quantity) > 0)
    );
  };

  const updateCartCost = (id: string, text: string) => {
    const minor = text ? Math.round(parseFloat(text) * 100).toString() : '0';
    setCart((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unitCostMinor: minor } : c))
    );
  };

  const removeCartItem = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const totalMinor = cart.reduce((sum, c) => {
    const qty = parseFloat(c.quantity) || 0;
    const cost = parseInt(c.unitCostMinor, 10) || 0;
    return sum + qty * cost;
  }, 0);

  const handleReceiveStock = async () => {
    if (!activeBusiness) return;
    if (!selectedSupplier) {
      Alert.alert('Supplier Required', 'Please select a supplier for this stock shipment.');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Items Required', 'Please select at least one item to receive into stock.');
      return;
    }

    setLoading(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const payments = [];
      if (paymentMethod !== 'unpaid' && totalMinor > 0) {
        payments.push({
          amountMinor: Math.round(totalMinor).toString(),
          paymentMethod: paymentMethod,
        });
      }

      const draft = {
        supplierId: selectedSupplier.id,
        currencyCode,
        effectiveDate: todayStr,
        supplierReference: supplierReference.trim() || undefined,
        notes: notes.trim() || undefined,
        items: cart.map((c) => ({
          catalogItemId: c.catalogItem.id,
          quantity: c.quantity,
          unitCostMinor: (parseInt(c.unitCostMinor, 10) || 0).toString(),
        })),
        payments: payments.length > 0 ? payments : undefined,
        idempotencyKey: Crypto.randomUUID(),
      };

      const parsed = createStockReceiptSchema.safeParse(draft);
      if (!parsed.success) {
        const errorMsg = parsed.error.errors.map((e) => e.message).join('\n');
        Alert.alert('Validation Failed', errorMsg);
        setLoading(false);
        return;
      }

      const payload = {
        businessId: activeBusiness.id,
        ...parsed.data,
      };

      const { data, error } = await supabase.rpc('create_stock_receipt', {
        payload,
      });

      if (error) throw error;

      Alert.alert('Success', 'Stock received and inventory positions updated!', [
        {
          text: 'Done',
          onPress: () => router.replace('/(app)/inventory/'),
        },
      ]);
    } catch (err: any) {
      console.error('Error creating stock receipt:', err);
      Alert.alert('Receipt Failed', err.message || 'Failed to record stock receipt.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCatalogItems = catalogItems.filter(
    (item) =>
      item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(itemSearch.toLowerCase()))
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      (s.phone && s.phone.includes(supplierSearch))
  );

  if (fetching) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#B8F25C" />
        <Text style={styles.loadingText}>Loading suppliers & catalog...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Receive Stock</Text>
              <Text style={styles.subtext}>Log inventory shipment from supplier</Text>
            </View>
          </View>

          {/* Supplier Selector */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Supplier *</Text>
            <TouchableOpacity
              style={styles.supplierSelector}
              onPress={() => setSupplierModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.supplierSelectorLeft}>
                <View style={styles.supplierIconBox}>
                  <Feather name="truck" size={18} color="#B8F25C" />
                </View>
                <View>
                  <Text style={styles.supplierNameText}>
                    {selectedSupplier ? selectedSupplier.name : 'Select Supplier (Required)'}
                  </Text>
                  <Text style={styles.supplierSubtext}>
                    {selectedSupplier?.phone || selectedSupplier?.email || 'Tap to choose vendor'}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          {/* Supplier Invoice / Waybill Ref */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Supplier Reference / Invoice # (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. INV-99824 or Delivery Note #..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={supplierReference}
              onChangeText={setSupplierReference}
            />
          </View>

          {/* Catalog Items Selector */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Select Products to Receive</Text>
            <View style={styles.searchBar}>
              <Feather name="search" size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tracked products..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={itemSearch}
                onChangeText={setItemSearch}
              />
              {itemSearch.length > 0 && (
                <TouchableOpacity onPress={() => setItemSearch('')}>
                  <Feather name="x" size={18} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemChipScroll}>
              {filteredCatalogItems.length === 0 ? (
                <Text style={styles.emptyCatalogText}>No tracked products found.</Text>
              ) : (
                filteredCatalogItems.slice(0, 10).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemChip}
                    onPress={() => addToCart(item)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.itemChipName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemChipPrice}>
                      {item.cost_price_minor
                        ? formatMoney(parseInt(item.cost_price_minor as string, 10))
                        : 'No Cost Set'}
                    </Text>
                    <View style={styles.chipAddIcon}>
                      <Feather name="plus" size={14} color="#0A1C16" />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>

          {/* Cart Section */}
          <View style={styles.sectionCard}>
            <View style={styles.cartHeaderRow}>
              <Text style={styles.sectionTitle}>Received Items ({cart.length})</Text>
              {cart.length > 0 && (
                <TouchableOpacity onPress={() => setCart([])}>
                  <Text style={styles.clearCartText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <Feather name="box" size={32} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyCartText}>No items added. Tap products above to receive.</Text>
              </View>
            ) : (
              cart.map((c) => {
                const unitCost = parseInt(c.unitCostMinor, 10) || 0;
                const lineTotal = (parseFloat(c.quantity) || 0) * unitCost;

                return (
                  <View key={c.id} style={styles.cartItemRow}>
                    <View style={styles.cartItemLeft}>
                      <Text style={styles.cartItemName}>{c.catalogItem.name}</Text>
                      <View style={styles.costInputRow}>
                        <Text style={styles.costInputLabel}>Cost/unit ({currencyCode}):</Text>
                        <TextInput
                          style={styles.costInput}
                          keyboardType="numeric"
                          defaultValue={(unitCost / 100).toFixed(2)}
                          onEndEditing={(e) => updateCartCost(c.id, e.nativeEvent.text)}
                          placeholder="0.00"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                        />
                      </View>
                    </View>

                    <View style={styles.cartItemRight}>
                      <View style={styles.qtyControls}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateCartQty(c.id, -1)}
                        >
                          <Feather name="minus" size={14} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{c.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateCartQty(c.id, 1)}
                        >
                          <Feather name="plus" size={14} color="#FFF" />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.lineTotalText}>{formatMoney(lineTotal)}</Text>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => removeCartItem(c.id)}
                      >
                        <Feather name="trash-2" size={16} color="#FF4D4D" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Payment Method Selector */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Payment to Supplier</Text>
            <View style={styles.paymentMethodGrid}>
              {[
                { key: 'cash', label: 'Cash', icon: 'dollar-sign' },
                { key: 'bank_transfer', label: 'Transfer', icon: 'send' },
                { key: 'pos', label: 'POS / Card', icon: 'credit-card' },
                { key: 'unpaid', label: 'Unpaid (AP)', icon: 'clock' },
              ].map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.paymentMethodBtn,
                    paymentMethod === m.key && styles.paymentMethodBtnActive,
                  ]}
                  onPress={() => setPaymentMethod(m.key as any)}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={m.icon as any}
                    size={18}
                    color={paymentMethod === m.key ? '#0A1C16' : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === m.key && styles.paymentMethodTextActive,
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Shipment condition, warehouse location notes..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* Summary & Submit */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Shipment Total Cost</Text>
              <Text style={styles.totalAmount}>{formatMoney(Math.round(totalMinor))}</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleReceiveStock}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#0A1C16" />
              ) : (
                <Text style={styles.submitButtonText}>Confirm Stock Receipt</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Supplier Modal */}
      <Modal visible={supplierModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Supplier</Text>
              <TouchableOpacity onPress={() => setSupplierModalVisible(false)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Feather name="search" size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search suppliers..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={supplierSearch}
                onChangeText={setSupplierSearch}
              />
            </View>

            <FlatList
              data={filteredSuppliers}
              keyExtractor={(s) => s.id}
              renderItem={({ item }) => {
                const isSelected = selectedSupplier?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.supplierOption, isSelected && styles.supplierOptionActive]}
                    onPress={() => {
                      setSelectedSupplier(item);
                      setSupplierModalVisible(false);
                    }}
                  >
                    <View>
                      <Text style={styles.supplierOptionName}>{item.name}</Text>
                      <Text style={styles.supplierOptionSub}>{item.phone || item.email || 'Supplier'}</Text>
                    </View>
                    {isSelected && <Feather name="check" size={20} color="#B8F25C" />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyCustomerList}>
                  <Text style={styles.emptyCustomerText}>No suppliers found.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 14 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  backButton: { marginRight: 14, padding: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#FFF', marginBottom: 12 },

  supplierSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  supplierSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supplierIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierNameText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  supplierSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
    gap: 8,
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 14 },

  itemChipScroll: { flexDirection: 'row', marginHorizontal: -4 },
  itemChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 4,
    width: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  itemChipName: { fontSize: 13, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  itemChipPrice: { fontSize: 13, fontWeight: '800', color: '#B8F25C' },
  chipAddIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#B8F25C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCatalogText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, padding: 12 },

  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearCartText: { color: '#FF4D4D', fontSize: 12, fontWeight: '700' },
  emptyCartBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyCartText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },

  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  cartItemLeft: { flex: 1, marginRight: 8 },
  cartItemName: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  costInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  costInputLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  costInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: '#FFF',
    fontSize: 12,
    minWidth: 50,
  },

  cartItemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
  },
  qtyBtn: { padding: 6 },
  qtyText: { color: '#FFF', fontSize: 13, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  lineTotalText: { color: '#B8F25C', fontWeight: '800', fontSize: 14, minWidth: 64, textAlign: 'right' },
  deleteBtn: { padding: 4 },

  paymentMethodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paymentMethodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '48.5%',
  },
  paymentMethodBtnActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  paymentMethodText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  paymentMethodTextActive: { color: '#0A1C16' },

  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  summaryCard: {
    backgroundColor: '#0E291E',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
    marginBottom: 30,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: { fontSize: 16, color: '#FFF', fontWeight: '900' },
  totalAmount: { fontSize: 24, color: '#B8F25C', fontWeight: '900' },

  submitButton: {
    backgroundColor: '#B8F25C',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#0A1C16', fontWeight: '900', fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#0A1C16',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  supplierOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  supplierOptionActive: { backgroundColor: 'rgba(184, 242, 92, 0.1)' },
  supplierOptionName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  supplierOptionSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  emptyCustomerList: { padding: 24, alignItems: 'center' },
  emptyCustomerText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});
