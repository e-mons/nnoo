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
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';

interface CatalogItem {
  id: string;
  name: string;
  sku: string | null;
  unit_code: string;
  selling_price_minor: string | number;
  item_type: 'product' | 'service';
  track_inventory: boolean;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface InvoiceLineDraft {
  id: string;
  catalogItem: CatalogItem;
  quantity: string;
  discountMinor: string;
}

export default function NewInvoiceScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [dueDateDays, setDueDateDays] = useState('14'); // Net 14 by default
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<InvoiceLineDraft[]>([]);
  const [itemSearch, setItemSearch] = useState('');

  // Modals
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const currencyCode = (activeBusiness as any)?.currency_code || 'NGN';

  const formatMoney = (minor: number) => {
    return `${currencyCode} ${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    const loadDependencies = async () => {
      if (!activeBusiness) return;
      try {
        setFetching(true);
        const [itemsRes, custRes] = await Promise.all([
          supabase
            .from('catalog_items')
            .select('id, name, sku, unit_code, selling_price_minor, item_type, track_inventory')
            .eq('business_id', activeBusiness.id)
            .order('name'),
          supabase
            .from('customers')
            .select('id, name, phone, email')
            .eq('business_id', activeBusiness.id)
            .order('name'),
        ]);

        if (itemsRes.error) throw itemsRes.error;
        if (custRes.error) throw custRes.error;

        setCatalogItems(itemsRes.data || []);
        setCustomers(custRes.data || []);
      } catch (err: any) {
        console.error('Error fetching invoice dependencies:', err);
        Alert.alert('Error', 'Failed to load catalog and customers.');
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
          discountMinor: '0',
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

  const removeCartItem = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const subtotalMinor = cart.reduce((sum, c) => {
    const qty = parseFloat(c.quantity) || 0;
    const price = parseInt(c.catalogItem.selling_price_minor as string, 10) || 0;
    return sum + qty * price;
  }, 0);

  const discountTotalMinor = cart.reduce((sum, c) => {
    return sum + (parseInt(c.discountMinor, 10) || 0);
  }, 0);

  const totalMinor = Math.max(0, Math.round(subtotalMinor) - discountTotalMinor);

  const handleSaveInvoice = async (shouldIssue = false) => {
    if (!activeBusiness) return;
    if (!selectedCustomer) {
      Alert.alert('Customer Required', 'Please select a customer for this invoice.');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Items Required', 'Please add at least one line item to the invoice.');
      return;
    }

    setLoading(true);

    try {
      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + (parseInt(dueDateDays, 10) || 14));
      const dueDateStr = dueDate.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      const itemsPayload = cart.map((c, index) => {
        const unitPrice = parseInt(c.catalogItem.selling_price_minor as string, 10) || 0;
        const discount = parseInt(c.discountMinor, 10) || 0;
        const qty = parseFloat(c.quantity) || 1;
        const lineTotal = Math.round(qty * unitPrice) - discount;

        return {
          catalog_item_id: c.catalogItem.id,
          item_type_snapshot: c.catalogItem.item_type,
          item_name_snapshot: c.catalogItem.name,
          sku_snapshot: c.catalogItem.sku,
          unit_code_snapshot: c.catalogItem.unit_code,
          track_inventory_snapshot: c.catalogItem.track_inventory,
          quantity: c.quantity,
          unit_price_minor: unitPrice.toString(),
          discount_minor: discount.toString(),
          line_total_minor: lineTotal.toString(),
          line_order: index + 1,
        };
      });

      const draftPayload = {
        business_id: activeBusiness.id,
        customer_id: selectedCustomer.id,
        currency_code: currencyCode,
        subtotal_minor: Math.round(subtotalMinor).toString(),
        discount_total_minor: discountTotalMinor.toString(),
        total_minor: totalMinor.toString(),
        due_date: dueDateStr,
        notes: notes.trim() || null,
        items: itemsPayload,
      };

      const { data: invoiceId, error: draftError } = await supabase.rpc(
        'save_invoice_draft',
        { payload: draftPayload }
      );

      if (draftError) throw draftError;

      if (shouldIssue && invoiceId) {
        const issuePayload = {
          invoice_id: invoiceId,
          business_id: activeBusiness.id,
          currency_code: currencyCode,
          effective_date: todayStr,
          items: cart.map((c) => ({
            catalogItemId: c.catalogItem.id,
            quantity: c.quantity,
            discountMinor: c.discountMinor || '0',
          })),
          idempotency_key: Crypto.randomUUID(),
        };

        const { error: issueError } = await supabase.rpc('issue_invoice', {
          payload: issuePayload,
        });

        if (issueError) throw issueError;
      }

      Alert.alert(
        'Success',
        shouldIssue ? 'Invoice issued successfully!' : 'Invoice draft saved!',
        [
          {
            text: 'View Invoices',
            onPress: () => router.replace('/(app)/invoices/'),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error saving invoice:', err);
      Alert.alert('Operation Failed', err.message || 'Failed to process invoice.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCatalogItems = catalogItems.filter(
    (item) =>
      item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(itemSearch.toLowerCase()))
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(customerSearch))
  );

  if (fetching) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#B8F25C" />
        <Text style={styles.loadingText}>Loading invoice resources...</Text>
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
              <Text style={styles.headerTitle}>Create Invoice</Text>
              <Text style={styles.subtext}>Bill customers with formal terms</Text>
            </View>
          </View>

          {/* Customer Selection Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Customer *</Text>
            <TouchableOpacity
              style={styles.customerSelector}
              onPress={() => setCustomerModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.customerSelectorLeft}>
                <View style={styles.customerIconBox}>
                  <Feather name="user" size={18} color="#B8F25C" />
                </View>
                <View>
                  <Text style={styles.customerNameText}>
                    {selectedCustomer ? selectedCustomer.name : 'Select Customer (Required)'}
                  </Text>
                  <Text style={styles.customerSubtext}>
                    {selectedCustomer?.phone || selectedCustomer?.email || 'Tap to choose client'}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          {/* Due Date Terms */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            <View style={styles.termsGrid}>
              {[
                { label: 'Due in 7 Days', days: '7' },
                { label: 'Net 14 Days', days: '14' },
                { label: 'Net 30 Days', days: '30' },
                { label: 'Due on Receipt', days: '0' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.days}
                  style={[
                    styles.termBtn,
                    dueDateDays === t.days && styles.termBtnActive,
                  ]}
                  onPress={() => setDueDateDays(t.days)}
                >
                  <Text
                    style={[
                      styles.termBtnText,
                      dueDateDays === t.days && styles.termBtnTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Catalog Items Selector */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Select Items to Bill</Text>
            <View style={styles.searchBar}>
              <Feather name="search" size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products or services..."
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
                <Text style={styles.emptyCatalogText}>No catalog items found.</Text>
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
                      {formatMoney(parseInt(item.selling_price_minor as string, 10) || 0)}
                    </Text>
                    <View style={styles.chipAddIcon}>
                      <Feather name="plus" size={14} color="#0A1C16" />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>

          {/* Invoice Lines Table */}
          <View style={styles.sectionCard}>
            <View style={styles.cartHeaderRow}>
              <Text style={styles.sectionTitle}>Invoice Items ({cart.length})</Text>
              {cart.length > 0 && (
                <TouchableOpacity onPress={() => setCart([])}>
                  <Text style={styles.clearCartText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <Feather name="file-plus" size={32} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyCartText}>No line items added to invoice.</Text>
              </View>
            ) : (
              cart.map((c) => {
                const unitPrice = parseInt(c.catalogItem.selling_price_minor as string, 10) || 0;
                const lineTotal = (parseFloat(c.quantity) || 0) * unitPrice;

                return (
                  <View key={c.id} style={styles.cartItemRow}>
                    <View style={styles.cartItemLeft}>
                      <Text style={styles.cartItemName}>{c.catalogItem.name}</Text>
                      <Text style={styles.cartItemUnitPrice}>
                        {formatMoney(unitPrice)} / {c.catalogItem.unit_code}
                      </Text>
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

          {/* Notes */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Notes & Payment Instructions</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. Please transfer to Bank account details..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* Financial Summary & Actions */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatMoney(Math.round(subtotalMinor))}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Invoice Total</Text>
              <Text style={styles.totalAmount}>{formatMoney(totalMinor)}</Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.draftButton, loading && styles.submitButtonDisabled]}
                onPress={() => handleSaveInvoice(false)}
                disabled={loading}
              >
                <Text style={styles.draftButtonText}>Save Draft</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.issueButton, loading && styles.submitButtonDisabled]}
                onPress={() => handleSaveInvoice(true)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0A1C16" />
                ) : (
                  <Text style={styles.issueButtonText}>Issue Invoice</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Customer Selection Modal */}
      <Modal visible={customerModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Feather name="search" size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search customers..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={customerSearch}
                onChangeText={setCustomerSearch}
              />
            </View>

            <FlatList
              data={filteredCustomers}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => {
                const isSelected = selectedCustomer?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.customerOption, isSelected && styles.customerOptionActive]}
                    onPress={() => {
                      setSelectedCustomer(item);
                      setCustomerModalVisible(false);
                    }}
                  >
                    <View>
                      <Text style={styles.customerOptionName}>{item.name}</Text>
                      <Text style={styles.customerOptionSub}>{item.phone || item.email || 'Client'}</Text>
                    </View>
                    {isSelected && <Feather name="check" size={20} color="#B8F25C" />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyCustomerList}>
                  <Text style={styles.emptyCustomerText}>No customers found.</Text>
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

  customerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  customerSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerNameText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  customerSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  termsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  termBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  termBtnActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  termBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  termBtnTextActive: { color: '#0A1C16' },

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
  cartItemLeft: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  cartItemUnitPrice: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  cartItemRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  summaryValue: { fontSize: 15, color: '#FFF', fontWeight: '700' },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },
  totalLabel: { fontSize: 18, color: '#FFF', fontWeight: '900' },
  totalAmount: { fontSize: 24, color: '#B8F25C', fontWeight: '900' },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  draftButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  draftButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  issueButton: {
    flex: 1.3,
    backgroundColor: '#B8F25C',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  issueButtonText: { color: '#0A1C16', fontWeight: '900', fontSize: 15 },
  submitButtonDisabled: { opacity: 0.5 },

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
  customerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  customerOptionActive: { backgroundColor: 'rgba(184, 242, 92, 0.1)' },
  customerOptionName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  customerOptionSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  emptyCustomerList: { padding: 24, alignItems: 'center' },
  emptyCustomerText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});
