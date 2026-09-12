import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Badge } from '../../../../components/Badge';
import { MoneyText } from '../../../../components/MoneyText';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const [item, setItem] = useState<any>(null);
  const [inventoryPos, setInventoryPos] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchItem = async () => {
    if (!activeBusiness || !id) return;
    try {
      const [itemRes, posRes] = await Promise.all([
        supabase
          .from('catalog_items')
          .select('*')
          .eq('id', id)
          .eq('business_id', activeBusiness.id)
          .single(),
        supabase
          .from('inventory_positions')
          .select('*')
          .eq('catalog_item_id', id)
          .eq('business_id', activeBusiness.id)
          .maybeSingle(),
      ]);

      if (itemRes.error) throw itemRes.error;
      setItem(itemRes.data);
      setInventoryPos(posRes.data);
    } catch (err: any) {
      console.error('Error fetching item details', err);
      Alert.alert('Error', 'Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItem();
    }, [id, activeBusiness])
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color="#B8F25C" />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.errorText}>Item not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const sellingPrice = parseInt(item.selling_price_minor, 10) || 0;
  const costPrice = parseInt(item.cost_price_minor, 10) || 0;
  const profitMargin =
    costPrice > 0 ? (((sellingPrice - costPrice) / costPrice) * 100).toFixed(1) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/more/products/${item.id}/edit` as any)}
          style={styles.iconButton}
        >
          <Ionicons name="pencil" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Section */}
        <View style={styles.topSection}>
          <Text style={styles.name}>{item.name}</Text>
          <MoneyText amountMinor={item.selling_price_minor} style={styles.price} />
          <View style={styles.badges}>
            <Badge
              label={item.status}
              variant={item.status === 'active' ? 'success' : 'default'}
            />
            <Badge
              label={item.item_type?.toUpperCase()}
              variant={item.item_type === 'product' ? 'success' : 'warning'}
            />
            {item.track_inventory && (
              <Badge label="Inventory Tracked" variant="info" />
            )}
          </View>
        </View>

        {/* Pricing Metrics Card */}
        <View style={styles.pricingCard}>
          <View style={styles.pricingItem}>
            <Text style={styles.pricingLabel}>Selling Price</Text>
            <MoneyText amountMinor={item.selling_price_minor} style={styles.sellingValue} />
          </View>
          <View style={styles.pricingDivider} />
          <View style={styles.pricingItem}>
            <Text style={styles.pricingLabel}>Cost Price</Text>
            <MoneyText amountMinor={item.cost_price_minor || 0} style={styles.costValue} />
          </View>
          {profitMargin && (
            <>
              <View style={styles.pricingDivider} />
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Markup</Text>
                <Text style={styles.marginValue}>+{profitMargin}%</Text>
              </View>
            </>
          )}
        </View>

        {/* Live Stock Position Card (if tracked) */}
        {item.track_inventory && (
          <View style={styles.stockCard}>
            <View style={styles.stockCardHeader}>
              <View>
                <Text style={styles.stockCardLabel}>Current Stock On-Hand</Text>
                <Text style={styles.stockQuantity}>
                  {inventoryPos?.on_hand_quantity || '0'}{' '}
                  <Text style={styles.unitText}>
                    {item.unit_code?.toUpperCase() || 'ITEMS'}
                  </Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.inventoryLinkBtn}
                onPress={() => router.push(`/(app)/inventory/${item.id}` as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.inventoryLinkBtnText}>Adjust Stock</Text>
                <Feather name="chevron-right" size={14} color="#0A1C16" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Identification Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Item Identification</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SKU Code</Text>
            <Text style={styles.infoValue}>{item.sku || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Barcode</Text>
            <Text style={styles.infoValue}>{item.barcode || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Unit of Measure</Text>
            <Text style={styles.infoValue}>{item.unit_code?.toUpperCase() || 'ITEM'}</Text>
          </View>
        </View>

        {/* Description Card */}
        {item.description ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.descriptionText}>{item.description}</Text>
          </View>
        ) : null}

        {/* Action Button: Sell in POS */}
        <TouchableOpacity
          style={styles.posActionBtn}
          onPress={() => router.push('/(app)/sales/new' as any)}
          activeOpacity={0.8}
        >
          <Feather name="shopping-bag" size={18} color="#0A1C16" />
          <Text style={styles.posActionBtnText}>Sell in Point of Sale</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06130E' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },
  topSection: { marginBottom: 20 },
  name: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  price: { fontSize: 32, fontWeight: '900', color: '#B8F25C', marginVertical: 6 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },

  pricingCard: {
    backgroundColor: '#0E291E',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
    marginBottom: 16,
  },
  pricingItem: { alignItems: 'center' },
  pricingLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  sellingValue: { fontSize: 16, fontWeight: '900', color: '#B8F25C' },
  costValue: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  marginValue: { fontSize: 16, fontWeight: '900', color: '#B8F25C' },
  pricingDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },

  stockCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stockCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockCardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  stockQuantity: { fontSize: 24, fontWeight: '900', color: '#FFF', marginTop: 2 },
  unitText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  inventoryLinkBtn: {
    backgroundColor: '#B8F25C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  inventoryLinkBtnText: { color: '#0A1C16', fontSize: 12, fontWeight: '800' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  infoValue: { fontSize: 14, color: '#FFF', fontWeight: '600' },
  descriptionText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },

  posActionBtn: {
    backgroundColor: '#B8F25C',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 40,
  },
  posActionBtnText: { color: '#0A1C16', fontWeight: '900', fontSize: 16 },

  errorText: { color: '#FFF', fontSize: 16, marginBottom: 16 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  backBtnText: { color: '#FFF', fontWeight: 'bold' },
});
