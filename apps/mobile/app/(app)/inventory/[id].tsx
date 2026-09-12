import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { MoneyText } from '../../../components/MoneyText';
import { Badge } from '../../../components/Badge';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';

export default function InventoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { activeBusiness } = useBusiness();

  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);

  // Adjustment Modal State
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('stock_count_correction');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Initialize Modal State
  const [initModalVisible, setInitModalVisible] = useState(false);
  const [initQty, setInitQty] = useState('');
  const [initCost, setInitCost] = useState('');
  const [submittingInit, setSubmittingInit] = useState(false);

  const currencyCode = (activeBusiness as any)?.currency_code || 'NGN';

  const fetchPositionDetails = async () => {
    if (!activeBusiness || !id) return;
    try {
      const { data: posData, error: posError } = await supabase
        .from('inventory_positions')
        .select(`
          *,
          catalog_items (
            id,
            name,
            sku,
            unit_code,
            item_type,
            selling_price_minor,
            cost_price_minor,
            low_stock_threshold
          )
        `)
        .eq('id', id)
        .eq('business_id', activeBusiness.id)
        .single();

      if (posError) throw posError;
      setPosition(posData);

      if (posData?.catalog_item_id) {
        const { data: movData, error: movError } = await supabase
          .from('inventory_movements')
          .select('*')
          .eq('catalog_item_id', posData.catalog_item_id)
          .eq('business_id', activeBusiness.id)
          .order('occurred_at', { ascending: false })
          .limit(30);

        if (!movError) {
          setMovements(movData || []);
        }
      }
    } catch (err: any) {
      console.error('Error fetching inventory position:', err);
      Alert.alert('Error', err.message || 'Failed to load inventory item.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPositionDetails();
    }, [id, activeBusiness])
  );

  const handleAdjustInventory = async () => {
    if (!adjustQty || parseFloat(adjustQty) <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a positive adjustment quantity.');
      return;
    }

    setSubmittingAdjust(true);

    try {
      const delta = adjustmentType === 'increase'
        ? parseFloat(adjustQty)
        : -parseFloat(adjustQty);

      const unitCostMinor = position.catalog_items?.cost_price_minor || '0';

      const payload = {
        businessId: activeBusiness!.id,
        catalogItemId: position.catalog_item_id,
        quantityDelta: delta.toString(),
        unitCostMinor: unitCostMinor.toString(),
        reasonCode: adjustReason,
        notes: adjustNotes.trim() || undefined,
        currencyCode: currencyCode,
        idempotencyKey: Crypto.randomUUID(),
      };

      const { error } = await supabase.rpc('adjust_inventory', { payload });

      if (error) throw error;

      setAdjustModalVisible(false);
      setAdjustQty('');
      setAdjustNotes('');
      Alert.alert('Success', 'Stock adjustment recorded successfully.');
      fetchPositionDetails();
    } catch (err: any) {
      console.error('Error adjusting inventory:', err);
      Alert.alert('Adjustment Failed', err.message || 'Could not adjust inventory.');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const handleInitializeInventory = async () => {
    if (!initQty || parseFloat(initQty) <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter initial quantity on hand.');
      return;
    }

    setSubmittingInit(true);

    try {
      const unitCostMinor = initCost ? Math.round(parseFloat(initCost) * 100).toString() : '0';

      const payload = {
        businessId: activeBusiness!.id,
        catalogItemId: position.catalog_item_id,
        quantity: initQty,
        unitCostMinor: unitCostMinor,
        currencyCode: currencyCode,
        idempotencyKey: Crypto.randomUUID(),
      };

      const { error } = await supabase.rpc('initialize_inventory', { payload });

      if (error) throw error;

      setInitModalVisible(false);
      setInitQty('');
      setInitCost('');
      Alert.alert('Success', 'Inventory initialized successfully.');
      fetchPositionDetails();
    } catch (err: any) {
      console.error('Error initializing inventory:', err);
      Alert.alert('Initialization Failed', err.message || 'Could not initialize inventory.');
    } finally {
      setSubmittingInit(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color="#B8F25C" />
      </SafeAreaView>
    );
  }

  if (!position) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.errorText}>Stock position not found.</Text>
        <TouchableOpacity style={styles.backBtnAction} onPress={() => router.back()}>
          <Text style={styles.backBtnActionText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const catalogItem = position.catalog_items;
  const qty = parseFloat(position.quantity_on_hand || '0');
  const threshold = catalogItem?.low_stock_threshold || 0;
  const isLowStock = threshold > 0 && qty <= threshold;
  const isPending = position.status === 'pending_initialization';
  const unit = catalogItem?.unit_code || 'units';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {catalogItem?.name || 'Stock Item'}
          </Text>
          <Text style={styles.subtext}>
            {catalogItem?.sku ? `SKU: ${catalogItem.sku}` : 'Tracked Product'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quantity Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLabel}>Available Stock</Text>
              <Text style={styles.heroQuantity}>
                {qty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {unit}
              </Text>
            </View>
            <Badge
              label={isPending ? 'Uninitialized' : isLowStock ? 'Low Stock' : 'In Stock'}
              variant={isPending ? 'warning' : isLowStock ? 'error' : 'success'}
            />
          </View>

          <View style={styles.valuationRow}>
            <Text style={styles.valuationLabel}>Total Valuation:</Text>
            <MoneyText
              amountMinor={position.inventory_value_minor}
              style={styles.valuationAmount}
            />
          </View>

          {isPending ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setInitModalVisible(true)}
              activeOpacity={0.8}
            >
              <Feather name="play" size={18} color="#0A1C16" />
              <Text style={styles.actionBtnText}>Initialize Starting Stock</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setAdjustModalVisible(true)}
              activeOpacity={0.8}
            >
              <Feather name="sliders" size={18} color="#0A1C16" />
              <Text style={styles.actionBtnText}>Adjust Stock Level</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Specifications</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Selling Price</Text>
            <Text style={styles.infoValue}>
              {currencyCode} {(parseInt(catalogItem?.selling_price_minor || '0', 10) / 100).toFixed(2)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cost Price</Text>
            <Text style={styles.infoValue}>
              {catalogItem?.cost_price_minor
                ? `${currencyCode} ${(parseInt(catalogItem.cost_price_minor, 10) / 100).toFixed(2)}`
                : 'Not Set'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Low Stock Alert</Text>
            <Text style={styles.infoValue}>
              {threshold > 0 ? `${threshold} ${unit}` : 'Disabled'}
            </Text>
          </View>
        </View>

        {/* Movement History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Stock Movements ({movements.length})</Text>
          {movements.length === 0 ? (
            <Text style={styles.emptyMovementsText}>No stock movements logged yet.</Text>
          ) : (
            movements.map((m, index) => {
              const delta = parseFloat(m.quantity_delta || '0');
              const isPositive = delta > 0;
              return (
                <View
                  key={m.id || index}
                  style={[styles.movementRow, index > 0 && styles.movementRowBorder]}
                >
                  <View>
                    <Text style={styles.movementType}>
                      {m.movement_type?.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.movementDate}>
                      {new Date(m.occurred_at || m.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.movementDelta,
                      { color: isPositive ? '#B8F25C' : '#FF4D4D' },
                    ]}
                  >
                    {isPositive ? `+${delta}` : delta} {unit}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Adjust Inventory Modal */}
      <Modal visible={adjustModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Stock Level</Text>
              <TouchableOpacity onPress={() => setAdjustModalVisible(false)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  adjustmentType === 'increase' && styles.toggleBtnActive,
                ]}
                onPress={() => setAdjustmentType('increase')}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    adjustmentType === 'increase' && styles.toggleBtnTextActive,
                  ]}
                >
                  + Add Stock
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  adjustmentType === 'decrease' && styles.toggleBtnActiveDecrease,
                ]}
                onPress={() => setAdjustmentType('decrease')}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    adjustmentType === 'decrease' && styles.toggleBtnTextActive,
                  ]}
                >
                  - Reduce Stock
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Quantity ({unit})</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={adjustQty}
              onChangeText={setAdjustQty}
              placeholder="e.g. 10"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <Text style={styles.inputLabel}>Reason Code</Text>
            <View style={styles.reasonsRow}>
              {[
                { key: 'stock_count_correction', label: 'Count Correction' },
                { key: 'damage', label: 'Damaged Goods' },
                { key: 'shrinkage', label: 'Shrinkage / Loss' },
                { key: 'internal_use', label: 'Internal Use' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[
                    styles.reasonChip,
                    adjustReason === r.key && styles.reasonChipActive,
                  ]}
                  onPress={() => setAdjustReason(r.key)}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      adjustReason === r.key && styles.reasonChipTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Notes / Remarks (Optional)</Text>
            <TextInput
              style={styles.modalNotesInput}
              value={adjustNotes}
              onChangeText={setAdjustNotes}
              placeholder="Explain reason for adjustment..."
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, submittingAdjust && styles.modalSubmitBtnDisabled]}
              onPress={handleAdjustInventory}
              disabled={submittingAdjust}
            >
              {submittingAdjust ? (
                <ActivityIndicator color="#0A1C16" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Confirm Stock Adjustment</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Initialize Inventory Modal */}
      <Modal visible={initModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Initialize Starting Stock</Text>
              <TouchableOpacity onPress={() => setInitModalVisible(false)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Initial Quantity On Hand ({unit}) *</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={initQty}
              onChangeText={setInitQty}
              placeholder="e.g. 50"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <Text style={styles.inputLabel}>Unit Cost ({currencyCode})</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={initCost}
              onChangeText={setInitCost}
              placeholder="e.g. 1500.00"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, submittingInit && styles.modalSubmitBtnDisabled]}
              onPress={handleInitializeInventory}
              disabled={submittingInit}
            >
              {submittingInit ? (
                <ActivityIndicator color="#0A1C16" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Save Opening Stock</Text>
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
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 4,
  },
  backButton: { marginRight: 14, padding: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  heroCard: {
    backgroundColor: '#0E291E',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginBottom: 4 },
  heroQuantity: { fontSize: 28, fontWeight: '900', color: '#B8F25C' },

  valuationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  valuationLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  valuationAmount: { fontSize: 16, fontWeight: '800' },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B8F25C',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  actionBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 15 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 14 },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  infoValue: { fontSize: 15, color: '#FFF', fontWeight: '700' },

  emptyMovementsText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  movementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  movementRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  movementType: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  movementDate: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  movementDelta: { fontSize: 15, fontWeight: '800' },

  errorText: { color: '#FFF', fontSize: 16, marginBottom: 16 },
  backBtnAction: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backBtnActionText: { color: '#FFF', fontWeight: 'bold' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#0A1C16',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
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

  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  toggleBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  toggleBtnActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  toggleBtnActiveDecrease: { backgroundColor: '#FF4D4D', borderColor: '#FF4D4D' },
  toggleBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  toggleBtnTextActive: { color: '#0A1C16' },

  inputLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 8 },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
  },
  reasonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  reasonChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  reasonChipActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  reasonChipText: { fontSize: 11, fontWeight: '600', color: '#FFF' },
  reasonChipTextActive: { color: '#0A1C16' },

  modalNotesInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },

  modalSubmitBtn: {
    backgroundColor: '#B8F25C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSubmitBtnDisabled: { opacity: 0.5 },
  modalSubmitBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 15 },
});
