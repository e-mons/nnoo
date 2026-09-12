import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../../lib/supabase';
import { useBusiness } from '../../../../../contexts/BusinessContext';
import { updateCatalogItemSchema } from '@nnoo/validation';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeBusiness } = useBusiness();
  const router = useRouter();

  const [itemType, setItemType] = useState<'product' | 'service'>('product');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [unitCode, setUnitCode] = useState('item');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [trackInventory, setTrackInventory] = useState(false);
  const [status, setStatus] = useState<'active' | 'archived'>('active');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchItem = async () => {
      if (!activeBusiness || !id) return;
      try {
        setFetching(true);
        const { data, error } = await supabase
          .from('catalog_items')
          .select('*')
          .eq('id', id)
          .eq('business_id', activeBusiness.id)
          .single();

        if (error) throw error;

        setItemType(data.item_type as 'product' | 'service');
        setName(data.name || '');
        setDescription(data.description || '');
        setCategoryId(data.category_id || null);
        setUnitCode(data.unit_code || 'item');
        setSku(data.sku || '');
        setBarcode(data.barcode || '');
        setTrackInventory(data.track_inventory || false);
        setStatus(data.status || 'active');

        if (data.selling_price_minor) {
          setSellingPrice((Number(data.selling_price_minor) / 100).toFixed(2));
        }
        if (data.cost_price_minor) {
          setCostPrice((Number(data.cost_price_minor) / 100).toFixed(2));
        }

        const { data: catData } = await supabase
          .from('product_categories')
          .select('id, name')
          .eq('business_id', activeBusiness.id)
          .eq('status', 'active')
          .order('name', { ascending: true });
        setCategories(catData || []);
      } catch (err) {
        console.error('Error fetching item for edit:', err);
        Alert.alert('Error', 'Failed to load item details');
        router.back();
      } finally {
        setFetching(false);
      }
    };

    fetchItem();
  }, [id, activeBusiness]);

  const handleSubmit = async () => {
    if (!activeBusiness || !id) return;

    const sellingPriceMinor = sellingPrice
      ? Math.round(parseFloat(sellingPrice) * 100).toString()
      : '';

    const costPriceMinor = costPrice
      ? Math.round(parseFloat(costPrice) * 100).toString()
      : null;

    const payload = {
      itemType,
      name,
      description: description || null,
      categoryId: categoryId || null,
      unitCode,
      sku: sku || null,
      barcode: barcode || null,
      sellingPriceMinor,
      costPriceMinor,
      trackInventory: itemType === 'service' ? false : trackInventory,
    };

    const parsed = updateCatalogItemSchema.safeParse(payload);

    if (!parsed.success) {
      const newErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const validData = parsed.data;

      const { error } = await supabase
        .from('catalog_items')
        .update({
          item_type: validData.itemType,
          name: validData.name,
          description: validData.description || null,
          category_id: validData.categoryId || null,
          unit_code: validData.unitCode,
          sku: validData.sku || null,
          barcode: validData.barcode || null,
          selling_price_minor: validData.sellingPriceMinor,
          cost_price_minor: validData.costPriceMinor || null,
          track_inventory: validData.trackInventory,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('business_id', activeBusiness.id);

      if (error) throw error;

      router.back();
    } catch (err: any) {
      console.error('Error updating catalog item:', err);
      Alert.alert('Error', err.message || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#B8F25C" />
        </View>
      </SafeAreaView>
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
              <Text style={styles.headerTitle}>Edit Catalog Item</Text>
              <Text style={styles.subtext}>Update product or service</Text>
            </View>
          </View>

          {/* Status & Type Switcher */}
          <View style={styles.typeSelectorCard}>
            <Text style={styles.inputLabel}>Item Status</Text>
            <View style={styles.typeButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  status === 'active' && styles.typeButtonActive,
                ]}
                onPress={() => setStatus('active')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    status === 'active' && styles.typeButtonTextActive,
                  ]}
                >
                  Active Item
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  status === 'archived' && styles.typeButtonArchived,
                ]}
                onPress={() => setStatus('archived')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    status === 'archived' && styles.typeButtonTextArchived,
                  ]}
                >
                  Archived / Discontinued
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pricing & Name Card */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>General Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name *</Text>
              <View style={[styles.inputBox, errors.name ? styles.inputBoxError : null]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 500ml Bottled Water"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={name || ''}
                  onChangeText={setName}
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {categories.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                  <TouchableOpacity
                    style={[styles.unitChip, categoryId === null && styles.unitChipActive]}
                    onPress={() => setCategoryId(null)}
                  >
                    <Text style={[styles.unitChipText, categoryId === null && styles.unitChipTextActive]}>
                      None
                    </Text>
                  </TouchableOpacity>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.unitChip, categoryId === c.id && styles.unitChipActive]}
                      onPress={() => setCategoryId(c.id)}
                    >
                      <Text style={[styles.unitChipText, categoryId === c.id && styles.unitChipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Selling Price ({(activeBusiness as any)?.currency_code || 'NGN'}) *</Text>
                <View style={[styles.inputBox, errors.sellingPriceMinor ? styles.inputBoxError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={sellingPrice || ''}
                    onChangeText={setSellingPrice}
                    keyboardType="decimal-pad"
                  />
                </View>
                {errors.sellingPriceMinor ? (
                  <Text style={styles.errorText}>{errors.sellingPriceMinor}</Text>
                ) : null}
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Cost Price ({(activeBusiness as any)?.currency_code || 'NGN'})</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={costPrice || ''}
                    onChangeText={setCostPrice}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Units & Identification */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Identification & Units</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Unit of Measure</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                {['item', 'box', 'kg', 'litre', 'hour', 'service'].map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, unitCode === u && styles.unitChipActive]}
                    onPress={() => setUnitCode(u)}
                  >
                    <Text
                      style={[
                        styles.unitChipText,
                        unitCode === u && styles.unitChipTextActive,
                      ]}
                    >
                      {u.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {itemType === 'product' && (
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>SKU Code</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. PROD-001"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={sku || ''}
                      onChangeText={setSku}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Barcode</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 123456789"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={barcode || ''}
                      onChangeText={setBarcode}
                    />
                  </View>
                </View>
              </View>
            )}

            {itemType === 'product' && (
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Track Inventory Quantity</Text>
                  <Text style={styles.switchSub}>
                    Enables stock intake, position tracking, and reorder levels
                  </Text>
                </View>
                <Switch
                  value={trackInventory}
                  onValueChange={setTrackInventory}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#B8F25C' }}
                  thumbColor={trackInventory ? '#0A1C16' : '#FFF'}
                />
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Description</Text>
            <View style={[styles.inputBox, { height: 80, alignItems: 'flex-start' }]}>
              <TextInput
                style={[styles.input, { paddingTop: 10 }]}
                placeholder="Product specs, features, or service terms..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={description || ''}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0A1C16" />
            ) : (
              <Text style={styles.submitButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  backButton: { marginRight: 14, padding: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subtext: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  typeSelectorCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  typeButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  typeButtonActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  typeButtonArchived: { backgroundColor: 'rgba(255, 77, 77, 0.15)', borderColor: '#FF4D4D' },
  typeButtonText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },
  typeButtonTextActive: { color: '#0A1C16' },
  typeButtonTextArchived: { color: '#FF4D4D' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardSectionTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 14 },

  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginBottom: 6 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 10,
  },
  inputBoxError: { borderColor: '#FF4D4D' },
  input: { flex: 1, color: '#FFF', fontSize: 14 },
  errorText: { color: '#FF4D4D', fontSize: 12, marginTop: 4, fontWeight: '600' },

  rowInputs: { flexDirection: 'row', gap: 10 },

  unitScroll: { flexDirection: 'row', marginTop: 4 },
  unitChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  unitChipActive: { backgroundColor: '#B8F25C', borderColor: '#B8F25C' },
  unitChipText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' },
  unitChipTextActive: { color: '#0A1C16' },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  switchTitle: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  switchSub: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },

  submitButton: {
    backgroundColor: '#B8F25C',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#0A1C16', fontWeight: '900', fontSize: 16 },
});
