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
import { Feather, Ionicons } from '@expo/vector-icons';

export default function SuppliersIndexScreen() {
  const { activeBusiness } = useBusiness();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'business' | 'individual' | 'active'>('all');
  const router = useRouter();

  const fetchSuppliers = async () => {
    if (!activeBusiness) return;
    try {
      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('business_id', activeBusiness.id)
        .order('name', { ascending: true })
        .limit(100);

      if (searchQuery.trim() !== '') {
        const sq = searchQuery.trim();
        query = query.or(
          `name.ilike.%${sq}%,email.ilike.%${sq}%,phone.ilike.%${sq}%,company_name.ilike.%${sq}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Error fetching suppliers', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSuppliers();
    }, [activeBusiness, searchQuery])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSuppliers();
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (filter === 'business') return s.supplier_type === 'business';
    if (filter === 'individual') return s.supplier_type === 'individual';
    if (filter === 'active') return s.status === 'active';
    return true;
  });

  const renderItem = ({ item }: { item: any }) => {
    const isBusiness = item.supplier_type === 'business';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/more/suppliers/${item.id}` as any)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.name?.[0] || 'S').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.supplierName}>{item.name}</Text>
              <Badge
                label={item.status}
                variant={item.status === 'active' ? 'success' : 'default'}
              />
            </View>
            {item.company_name ? (
              <Text style={styles.companyName}>{item.company_name}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.contactInfo}>
            {item.phone ? (
              <View style={styles.contactLine}>
                <Feather name="phone" size={12} color="rgba(255,255,255,0.5)" />
                <Text style={styles.contactText}>{item.phone}</Text>
              </View>
            ) : null}
            {item.email ? (
              <View style={styles.contactLine}>
                <Feather name="mail" size={12} color="rgba(255,255,255,0.5)" />
                <Text style={styles.contactText}>{item.email}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.typeBadge}>
            <Text style={styles.typeLabel}>
              {isBusiness ? 'Vendor' : 'Individual'}
            </Text>
          </View>
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
          <Text style={styles.headerTitle}>Suppliers & Vendors</Text>
          <Text style={styles.subtext}>Vendor directory & procurement</Text>
        </View>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vendor, company, phone, email..."
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
            { key: 'all', label: `All (${suppliers.length})` },
            { key: 'business', label: 'Vendors' },
            { key: 'individual', label: 'Contractors' },
            { key: 'active', label: 'Active' },
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
          data={filteredSuppliers}
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
              <Feather name="truck" size={36} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No suppliers found.</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add vendors and contractors.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/more/suppliers/new' as any)}
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#B8F25C', fontSize: 18, fontWeight: '900' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  supplierName: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  companyName: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  contactInfo: { gap: 4, flex: 1 },
  contactLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },

  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },

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
