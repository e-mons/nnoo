import React, { useState, useEffect, useMemo } from 'react';
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
import { createSaleSchema, createCustomerSchema } from '@nnoo/validation';
import { PAYMENT_METHODS } from '@nnoo/contracts';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';

interface CatalogItem {
  id: string;
  name: string;
  sku: string | null;
  unit_code: string;
  selling_price_minor: string | number;
  item_type: 'product' | 'service';
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface CartItem {
  id: string;
  catalogItem: CatalogItem;
  quantity: string;
  discountMinor: string;
}

interface AppliedPayment {
  id: string;
  amountMinor: string;
  method: 'cash' | 'bank_transfer' | 'pos' | 'other';
}

export default function NewSaleScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Sale State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payments, setPayments] = useState<AppliedPayment[]>([]);

  // Custom Amount / Cash Tendered State
  const [customPaymentAmount, setCustomPaymentAmount] = useState('');
  const [customPaymentMethod, setCustomPaymentMethod] = useState<'cash' | 'bank_transfer' | 'pos' | 'other'>('cash');
  const [tenderedCashInput, setTenderedCashInput] = useState('');

  const [notes, setNotes] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Customer Modals
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomerModalVisible, setNewCustomerModalVisible] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const currencyCode = (activeBusiness as any)?.currency_code || 'NGN';

  const formatMoney = (minor: number) => {
    return `${currencyCode} ${(minor / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const loadDependencies = async () => {
    if (!activeBusiness) return;
    try {
      setFetching(true);
      const [itemsRes, custRes] = await Promise.all([
        supabase
          .from('catalog_items')
          .select('id, name, sku, unit_code, selling_price_minor, item_type')
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
      console.error('Error fetching POS dependencies:', err);
      Alert.alert('Error', 'Failed to load catalog and customer data.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, [activeBusiness]);

  // Cart operations
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

  const updateCartItemField = (id: string, field: 'quantity' | 'discountMinor', val: string) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, [field]: val };
        }
        return c;
      })
    );
  };

  const removeCartItem = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  // Calculations
  const cartSubtotalMinor = useMemo(() => {
    return cart.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseInt(item.catalogItem.selling_price_minor as string, 10) || 0;
      return sum + qty * price;
    }, 0);
  }, [cart]);

  const cartDiscountsTotalMinor = useMemo(() => {
    return cart.reduce((sum, item) => {
      return sum + (parseInt(item.discountMinor, 10) || 0);
    }, 0);
  }, [cart]);

  const cartTotalMinor = Math.max(0, Math.round(cartSubtotalMinor) - cartDiscountsTotalMinor);

  const totalPaidMinor = useMemo(() => {
    return payments.reduce((sum, p) => sum + (parseInt(p.amountMinor, 10) || 0), 0);
  }, [payments]);

  const remainingBalanceMinor = Math.max(0, cartTotalMinor - totalPaidMinor);

  // Cash Change Calculation when tendered cash is greater than remaining balance
  const cashChangeMinor = useMemo(() => {
    const tendered = parseFloat(tenderedCashInput) || 0;
    const tenderedMinor = Math.round(tendered * 100);
    if (tenderedMinor > remainingBalanceMinor && remainingBalanceMinor > 0) {
      return tenderedMinor - remainingBalanceMinor;
    }
    return 0;
  }, [tenderedCashInput, remainingBalanceMinor]);

  // Payment Actions
  const addFullPayment = (method: 'cash' | 'bank_transfer' | 'pos' | 'other') => {
    if (remainingBalanceMinor <= 0) return;
    setPayments((prev) => [
      ...prev,
      {
        id: Crypto.randomUUID(),
        amountMinor: remainingBalanceMinor.toString(),
        method,
      },
    ]);
    setTenderedCashInput('');
  };

  const addCustomPayment = () => {
    const amt = parseFloat(customPaymentAmount) || 0;
    const minor = Math.round(amt * 100);

    if (minor <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a payment amount greater than zero.');
      return;
    }
    if (minor > remainingBalanceMinor) {
      Alert.alert(
        'Amount Exceeded',
        `Payment cannot exceed the remaining balance of ${formatMoney(remainingBalanceMinor)}`
      );
      return;
    }

    setPayments((prev) => [
      ...prev,
      {
        id: Crypto.randomUUID(),
        amountMinor: minor.toString(),
        method: customPaymentMethod,
      },
    ]);
    setCustomPaymentAmount('');
  };

  const addTenderedCashPayment = () => {
    const tendered = parseFloat(tenderedCashInput) || 0;
    const tenderedMinor = Math.round(tendered * 100);

    if (tenderedMinor <= 0) {
      Alert.alert('Invalid Cash Amount', 'Please enter the amount of cash given by the customer.');
      return;
    }

    // Allocate up to remaining balance
    const allocatedMinor = Math.min(tenderedMinor, remainingBalanceMinor);

    setPayments((prev) => [
      ...prev,
      {
        id: Crypto.randomUUID(),
        amountMinor: allocatedMinor.toString(),
        method: 'cash',
      },
    ]);
  };

  const removePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAllPayments = () => {
    setPayments([]);
    setTenderedCashInput('');
    setCustomPaymentAmount('');
  };

  // Inline Customer Creation
  const handleCreateCustomerInline = async () => {
    if (!newCustName.trim()) {
      Alert.alert('Name Required', 'Please provide the customer’s name.');
      return;
    }

    setCreatingCustomer(true);
    try {
      const payload = {
        businessId: activeBusiness!.id,
        name: newCustName.trim(),
        phone: newCustPhone.trim() || undefined,
        email: newCustEmail.trim() || undefined,
        customerType: 'individual' as const,
      };

      const parsed = createCustomerSchema.safeParse(payload);
      if (!parsed.success) {
        Alert.alert('Validation Error', parsed.error.errors[0]?.message || 'Invalid customer info');
        setCreatingCustomer(false);
        return;
      }

      const { data, error } = await supabase
        .from('customers')
        .insert({
          business_id: activeBusiness!.id,
          name: parsed.data.name,
          phone: parsed.data.phone || null,
          email: parsed.data.email || null,
          customer_type: parsed.data.customerType,
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedCustomer(data);
      setCustomers((prev) => [data, ...prev]);
      setNewCustomerModalVisible(false);
      setCustomerModalVisible(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      Alert.alert('Customer Added', `Selected ${data.name} for this sale.`);
    } catch (err: any) {
      console.error('Error creating customer:', err);
      Alert.alert('Failed to Add Customer', err.message || 'An error occurred.');
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Checkout Handler
  const handleCheckout = async () => {
    if (!activeBusiness) return;
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add at least one item to complete the sale.');
      return;
    }

    if (remainingBalanceMinor > 0 && !selectedCustomer) {
      Alert.alert(
        'Customer Required',
        `An unpaid balance of ${formatMoney(remainingBalanceMinor)} remains. A customer must be selected for credit sales.`
      );
      return;
    }

    setLoading(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const saleDraft = {
        customerId: selectedCustomer?.id || undefined,
        currencyCode,
        effectiveDate: todayStr,
        notes: notes.trim() || undefined,
        items: cart.map((c) => ({
          catalogItemId: c.catalogItem.id,
          quantity: c.quantity,
          discountMinor: c.discountMinor || '0',
        })),
        payments:
          payments.length > 0
            ? payments.map((p) => ({
                amountMinor: p.amountMinor,
                paymentMethod: p.method,
              }))
            : undefined,
        idempotencyKey: Crypto.randomUUID(),
      };

      const parsed = createSaleSchema.safeParse(saleDraft);
      if (!parsed.success) {
        const errorMsg = parsed.error.errors.map((e) => e.message).join('\n');
        Alert.alert('Validation Error', errorMsg);
        setLoading(false);
        return;
      }

      const payload = {
        businessId: activeBusiness.id,
        ...parsed.data,
      };

      const { data, error } = await supabase.rpc('create_sale', {
        payload,
      });

      if (error) throw error;

      Alert.alert('Sale Completed!', 'Receipt recorded and inventory updated.', [
        {
          text: 'View Receipt',
          onPress: () => {
            const saleId = typeof data === 'string' ? data : (data as any)?.id || data;
            if (saleId) {
              router.replace(`/(app)/sales/${saleId}` as any);
            } else {
              router.replace('/(app)/sales/');
            }
          },
        },
      ]);
    } catch (err: any) {
      console.error('Error creating sale:', err);
      Alert.alert('Sale Failed', err.message || 'Failed to process transaction.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCatalogItems = catalogItems.filter(
    (item) =>
      item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(itemSearchQuery.toLowerCase()))
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
        <Text style={styles.loadingText}>Loading POS Catalog & Register...</Text>
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
              <Text style={styles.headerTitle}>New Sale</Text>
              <Text style={styles.subtext}>Point of Sale & Billing Register</Text>
            </View>
          </View>

          {/* Customer Selection Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Customer (Required for Credit Sales)</Text>
            <TouchableOpacity
              style={styles.customerSelector}
              onPress={() => setCustomerModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.customerSelectorLeft}>
                <View style={styles.customerAvatar}>
                  <Feather name="user" size={18} color="#B8F25C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerNameText}>
                    {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                  </Text>
                  <Text style={styles.customerSubtext}>
                    {selectedCustomer?.phone || selectedCustomer?.email || 'Tap to assign customer'}
                  </Text>
                </View>
              </View>
              {selectedCustomer ? (
                <TouchableOpacity
                  onPress={() => setSelectedCustomer(null)}
                  style={styles.clearCustBtn}
                >
                  <Feather name="x" size={18} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              ) : (
                <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
              )}
            </TouchableOpacity>
          </View>

          {/* Catalog Item Browser */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Add Items</Text>
            <View style={styles.searchBar}>
              <Feather name="search" size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products or SKU..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={itemSearchQuery}
                onChangeText={setItemSearchQuery}
              />
              {itemSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setItemSearchQuery('')}>
                  <Feather name="x" size={18} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemChipScroll}>
              {filteredCatalogItems.length === 0 ? (
                <Text style={styles.emptyCatalogText}>No matching catalogue items.</Text>
              ) : (
                filteredCatalogItems.slice(0, 15).map((item) => (
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

          {/* Cart Section */}
          <View style={styles.sectionCard}>
            <View style={styles.cartHeaderRow}>
              <Text style={styles.sectionTitle}>Cart ({cart.length} items)</Text>
              {cart.length > 0 && (
                <TouchableOpacity onPress={() => setCart([])}>
                  <Text style={styles.clearCartText}>Clear Cart</Text>
                </TouchableOpacity>
              )}
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <Feather name="shopping-bag" size={32} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyCartText}>Cart is empty. Tap items above to add.</Text>
              </View>
            ) : (
              cart.map((c) => {
                const price = parseInt(c.catalogItem.selling_price_minor as string, 10) || 0;
                const qty = parseFloat(c.quantity) || 0;
                const discMinor = parseInt(c.discountMinor, 10) || 0;
                const lineTotal = Math.max(0, qty * price - discMinor);

                return (
                  <View key={c.id} style={styles.cartItemRow}>
                    {/* Item Top Info */}
                    <View style={styles.cartItemTopRow}>
                      <View style={styles.cartItemLeft}>
                        <Text style={styles.cartItemName}>{c.catalogItem.name}</Text>
                        <Text style={styles.cartItemUnitPrice}>
                          Price: {formatMoney(price)} / {c.catalogItem.unit_code}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => removeCartItem(c.id)}
                      >
                        <Feather name="trash-2" size={16} color="#FF4D4D" />
                      </TouchableOpacity>
                    </View>

                    {/* Inputs: Qty & Discount */}
                    <View style={styles.cartItemInputsRow}>
                      {/* Quantity Input with Stepper */}
                      <View style={styles.inputCol}>
                        <Text style={styles.inputMiniLabel}>Qty</Text>
                        <View style={styles.qtyControlBox}>
                          <TouchableOpacity
                            style={styles.qtyStepperBtn}
                            onPress={() => {
                              const curr = parseFloat(c.quantity) || 0;
                              if (curr > 1) {
                                updateCartItemField(c.id, 'quantity', (curr - 1).toString());
                              } else {
                                removeCartItem(c.id);
                              }
                            }}
                          >
                            <Feather name="minus" size={12} color="#FFF" />
                          </TouchableOpacity>
                          <TextInput
                            style={styles.qtyInput}
                            keyboardType="numeric"
                            value={c.quantity}
                            onChangeText={(val) => updateCartItemField(c.id, 'quantity', val)}
                          />
                          <TouchableOpacity
                            style={styles.qtyStepperBtn}
                            onPress={() => {
                              const curr = parseFloat(c.quantity) || 0;
                              updateCartItemField(c.id, 'quantity', (curr + 1).toString());
                            }}
                          >
                            <Feather name="plus" size={12} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Discount Input */}
                      <View style={styles.inputCol}>
                        <Text style={styles.inputMiniLabel}>Disc ({currencyCode})</Text>
                        <TextInput
                          style={styles.discInput}
                          keyboardType="numeric"
                          placeholder="0.00"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          value={discMinor > 0 ? (discMinor / 100).toString() : ''}
                          onChangeText={(val) => {
                            const n = parseFloat(val) || 0;
                            updateCartItemField(c.id, 'discountMinor', Math.round(n * 100).toString());
                          }}
                        />
                      </View>

                      {/* Line Total */}
                      <View style={styles.lineTotalCol}>
                        <Text style={styles.inputMiniLabel}>Total</Text>
                        <Text style={styles.lineTotalVal}>{formatMoney(lineTotal)}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Summary Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryBreakdown}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryVal}>{formatMoney(cartSubtotalMinor)}</Text>
              </View>
              {cartDiscountsTotalMinor > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#FF9800' }]}>Discounts</Text>
                  <Text style={[styles.summaryVal, { color: '#FF9800' }]}>
                    -{formatMoney(cartDiscountsTotalMinor)}
                  </Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.summaryDivider]}>
                <Text style={styles.totalLabel}>Total Order Amount</Text>
                <Text style={styles.totalAmount}>{formatMoney(cartTotalMinor)}</Text>
              </View>
            </View>
          </View>

          {/* Payment & Settlement Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Payment & Tendered Settlement</Text>

            {/* Quick Full Payment Buttons */}
            <Text style={styles.paymentSubTitle}>Quick Full Payment</Text>
            <View style={styles.quickPaymentGrid}>
              {[
                { key: 'cash', label: 'Full Cash' },
                { key: 'pos', label: 'Full POS' },
                { key: 'bank_transfer', label: 'Full Transfer' },
                { key: 'other', label: 'Full Other' },
              ].map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.quickPayBtn,
                    remainingBalanceMinor === 0 && styles.quickPayBtnDisabled,
                  ]}
                  onPress={() => addFullPayment(m.key as any)}
                  disabled={remainingBalanceMinor === 0}
                  activeOpacity={0.75}
                >
                  <Text style={styles.quickPayBtnText}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cash Given / Tendered Box with Automatic Change Calculator */}
            <View style={styles.cashTenderBox}>
              <Text style={styles.cashTenderTitle}>
                Cash Handed / Tendered Calculator
              </Text>
              <View style={styles.cashTenderInputRow}>
                <TextInput
                  style={styles.cashTenderInput}
                  placeholder={`Cash Given e.g. 10000`}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="numeric"
                  value={tenderedCashInput}
                  onChangeText={setTenderedCashInput}
                />
                <TouchableOpacity
                  style={[
                    styles.applyCashBtn,
                    (!tenderedCashInput || remainingBalanceMinor === 0) && styles.applyCashBtnDisabled,
                  ]}
                  onPress={addTenderedCashPayment}
                  disabled={!tenderedCashInput || remainingBalanceMinor === 0}
                >
                  <Text style={styles.applyCashBtnText}>Apply Cash</Text>
                </TouchableOpacity>
              </View>

              {cashChangeMinor > 0 && (
                <View style={styles.changeNoticeBanner}>
                  <Feather name="corner-down-right" size={16} color="#B8F25C" />
                  <Text style={styles.changeNoticeLabel}>Cash Change to Return:</Text>
                  <Text style={styles.changeNoticeAmount}>{formatMoney(cashChangeMinor)}</Text>
                </View>
              )}
            </View>

            {/* Custom / Partial Payment Input */}
            <View style={styles.partialPayBox}>
              <Text style={styles.cashTenderTitle}>Partial / Split Payment Amount</Text>
              <TextInput
                style={styles.customAmtInput}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="numeric"
                value={customPaymentAmount}
                onChangeText={setCustomPaymentAmount}
              />
              <View style={styles.partialMethodRow}>
                {PAYMENT_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.methodChip,
                      customPaymentMethod === m && styles.methodChipActive,
                    ]}
                    onPress={() => setCustomPaymentMethod(m as any)}
                  >
                    <Text
                      style={[
                        styles.methodChipText,
                        customPaymentMethod === m && styles.methodChipTextActive,
                      ]}
                    >
                      {m.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.addCustomPayBtn,
                    (!customPaymentAmount || remainingBalanceMinor === 0) && styles.addCustomPayBtnDisabled,
                  ]}
                  onPress={addCustomPayment}
                  disabled={!customPaymentAmount || remainingBalanceMinor === 0}
                >
                  <Text style={styles.addCustomPayBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Applied Payments Breakdown */}
            {payments.length > 0 && (
              <View style={styles.appliedPaymentsSection}>
                <View style={styles.appliedHeaderRow}>
                  <Text style={styles.appliedTitle}>Applied Payments ({payments.length})</Text>
                  <TouchableOpacity onPress={clearAllPayments}>
                    <Text style={styles.clearPaymentsText}>Clear All</Text>
                  </TouchableOpacity>
                </View>

                {payments.map((p) => (
                  <View key={p.id} style={styles.appliedPaymentItem}>
                    <View style={styles.appliedLeft}>
                      <Feather name="check-circle" size={16} color="#B8F25C" />
                      <Text style={styles.appliedMethodText}>
                        {p.method.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.appliedRight}>
                      <Text style={styles.appliedAmountText}>
                        {formatMoney(parseInt(p.amountMinor, 10))}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removePayment(p.id)}
                        style={styles.appliedDeleteBtn}
                      >
                        <Feather name="trash-2" size={14} color="#FF4D4D" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Balance Due / Status Indicator */}
            <View style={styles.balanceStatusBox}>
              <View style={styles.balanceStatusRow}>
                <Text style={styles.balanceStatusLabel}>Total Paid:</Text>
                <Text style={styles.balancePaidVal}>{formatMoney(totalPaidMinor)}</Text>
              </View>
              <View style={styles.balanceStatusRow}>
                <Text style={styles.balanceStatusLabel}>Remaining Balance Due:</Text>
                <Text
                  style={[
                    styles.balanceRemainingVal,
                    remainingBalanceMinor > 0 ? { color: '#FF9800' } : { color: '#B8F25C' },
                  ]}
                >
                  {formatMoney(remainingBalanceMinor)}
                </Text>
              </View>
            </View>
          </View>

          {/* Order Notes */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Order Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Delivery instructions, reference, invoice remarks..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* Submit Action */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleCheckout}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#0A1C16" />
            ) : (
              <View style={styles.submitBtnContent}>
                <Feather name="check" size={20} color="#0A1C16" />
                <Text style={styles.submitButtonText}>
                  {remainingBalanceMinor === 0
                    ? 'Complete Sale & Issue Receipt'
                    : `Save Credit Sale (${formatMoney(remainingBalanceMinor)} Due)`}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Customer Picker Modal */}
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

            <TouchableOpacity
              style={styles.quickAddCustBtn}
              onPress={() => setNewCustomerModalVisible(true)}
            >
              <Feather name="user-plus" size={18} color="#0A1C16" />
              <Text style={styles.quickAddCustBtnText}>+ Create New Customer</Text>
            </TouchableOpacity>

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
                      <Text style={styles.customerOptionSub}>
                        {item.phone || item.email || 'Customer'}
                      </Text>
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

      {/* Inline Create Customer Modal */}
      <Modal visible={newCustomerModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Customer</Text>
              <TouchableOpacity onPress={() => setNewCustomerModalVisible(false)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Chukwuma Obi"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={newCustName}
              onChangeText={setNewCustName}
            />

            <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 08012345678"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={newCustPhone}
              onChangeText={setNewCustPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Email Address (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. customer@example.com"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={newCustEmail}
              onChangeText={setNewCustEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.submitButton, creatingCustomer && styles.submitButtonDisabled]}
              onPress={handleCreateCustomerInline}
              disabled={creatingCustomer}
            >
              {creatingCustomer ? (
                <ActivityIndicator color="#0A1C16" />
              ) : (
                <Text style={styles.submitButtonText}>Save & Select Customer</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 14 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  backButton: {
    marginRight: 14,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },

  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  paymentSubTitle: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 8 },

  customerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  customerSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  customerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(184, 242, 92, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerNameText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  customerSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  clearCustBtn: { padding: 6 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 14 },
  itemChipScroll: { marginHorizontal: -4 },
  emptyCatalogText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, padding: 8 },
  itemChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 4,
    width: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  itemChipName: { fontSize: 13, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  itemChipPrice: { fontSize: 13, fontWeight: '900', color: '#B8F25C' },
  chipAddIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#B8F25C',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  clearCartText: { color: '#FF4D4D', fontSize: 13, fontWeight: '600' },
  emptyCartBox: { padding: 24, alignItems: 'center', gap: 8 },
  emptyCartText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },

  cartItemRow: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cartItemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cartItemLeft: { flex: 1, marginRight: 8 },
  cartItemName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  cartItemUnitPrice: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  deleteBtn: { padding: 4 },

  cartItemInputsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  inputCol: { width: 100 },
  inputMiniLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  qtyControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    height: 38,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  qtyStepperBtn: { width: 28, height: 38, justifyContent: 'center', alignItems: 'center' },
  qtyInput: { flex: 1, color: '#FFF', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  discInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    height: 38,
    paddingHorizontal: 8,
    color: '#FFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lineTotalCol: { flex: 1, alignItems: 'flex-end', justifyContent: 'flex-end' },
  lineTotalVal: { fontSize: 16, fontWeight: '900', color: '#B8F25C', height: 38, lineHeight: 38 },

  summaryBreakdown: { gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  summaryVal: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontWeight: '900', color: '#FFF' },
  totalAmount: { fontSize: 20, fontWeight: '900', color: '#B8F25C' },

  quickPaymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  quickPayBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickPayBtnDisabled: { opacity: 0.4 },
  quickPayBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF', textTransform: 'capitalize' },

  cashTenderBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cashTenderTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  cashTenderInputRow: { flexDirection: 'row', gap: 8 },
  cashTenderInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  applyCashBtn: {
    backgroundColor: '#B8F25C',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyCashBtnDisabled: { opacity: 0.4 },
  applyCashBtnText: { color: '#0A1C16', fontSize: 13, fontWeight: '800' },

  changeNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  changeNoticeLabel: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  changeNoticeAmount: { fontSize: 14, color: '#B8F25C', fontWeight: '900' },

  partialPayBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  customAmtInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  partialMethodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  methodChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  methodChipActive: { backgroundColor: '#B8F25C' },
  methodChipText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' },
  methodChipTextActive: { color: '#0A1C16' },

  addCustomPayBtn: {
    backgroundColor: '#B8F25C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  addCustomPayBtnDisabled: { opacity: 0.4 },
  addCustomPayBtnText: { color: '#0A1C16', fontSize: 13, fontWeight: '800' },

  appliedPaymentsSection: {
    backgroundColor: 'rgba(184, 242, 92, 0.06)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.2)',
  },
  appliedHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  appliedTitle: { fontSize: 13, fontWeight: '800', color: '#B8F25C' },
  clearPaymentsText: { fontSize: 12, fontWeight: '700', color: '#FF4D4D' },
  appliedPaymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  appliedLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appliedMethodText: { fontSize: 13, color: '#FFF', fontWeight: '700' },
  appliedRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appliedAmountText: { fontSize: 14, color: '#B8F25C', fontWeight: '800' },
  appliedDeleteBtn: { padding: 4 },

  balanceStatusBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  balanceStatusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceStatusLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  balancePaidVal: { fontSize: 14, color: '#B8F25C', fontWeight: '800' },
  balanceRemainingVal: { fontSize: 15, fontWeight: '900' },

  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  submitButton: {
    backgroundColor: '#B8F25C',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitButtonText: { color: '#0A1C16', fontSize: 15, fontWeight: '900' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0E291E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 6, marginTop: 12 },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
  },
  quickAddCustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B8F25C',
    borderRadius: 12,
    height: 44,
    marginBottom: 14,
  },
  quickAddCustBtnText: { fontSize: 14, fontWeight: '800', color: '#0A1C16' },
  customerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  customerOptionActive: { backgroundColor: 'rgba(184, 242, 92, 0.08)' },
  customerOptionName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  customerOptionSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  emptyCustomerList: { padding: 24, alignItems: 'center' },
  emptyCustomerText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
});
