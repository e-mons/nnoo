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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useBusiness } from '../../../../contexts/BusinessContext';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type ContactTab = 'customers' | 'suppliers';

export default function ContactsHubScreen() {
  const { activeBusiness } = useBusiness();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ContactTab>('customers');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Data sets
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const fetchContacts = async () => {
    if (!activeBusiness) return;
    try {
      const [customersRes, suppliersRes] = await Promise.all([
        supabase
          .from('customers')
          .select(`
            id,
            name,
            phone,
            email,
            customer_type,
            status,
            created_at
          `)
          .eq('business_id', activeBusiness.id)
          .order('name', { ascending: true })
          .limit(100),
        supabase
          .from('suppliers')
          .select(`
            id,
            name,
            phone,
            email,
            contact_person,
            status,
            created_at
          `)
          .eq('business_id', activeBusiness.id)
          .order('name', { ascending: true })
          .limit(100),
      ]);

      if (customersRes.error) console.error('Error fetching customers:', customersRes.error);
      if (suppliersRes.error) console.error('Error fetching suppliers:', suppliersRes.error);

      setCustomers(customersRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (err) {
      console.error('ContactsHub: error loading contacts', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, [activeBusiness])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContacts();
    setRefreshing(false);
  };

  // KPIs
  const activeCustomersCount = useMemo(() => {
    return customers.filter((c) => c.status === 'active').length;
  }, [customers]);

  const activeSuppliersCount = useMemo(() => {
    return suppliers.filter((s) => s.status === 'active').length;
  }, [suppliers]);

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const query = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.phone && c.phone.includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query))
    );
  }, [customers, search]);

  const filteredSuppliers = useMemo(() => {
    if (!search.trim()) return suppliers;
    const query = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        (s.phone && s.phone.includes(query)) ||
        (s.email && s.email.toLowerCase().includes(query)) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(query))
    );
  }, [suppliers, search]);

  const handleCall = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  const handleEmail = (email?: string) => {
    if (email) {
      Linking.openURL(`mailto:${email}`).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A1C16', '#0F261E', '#0A1C16']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.tag}>
              <Feather name="users" size={12} color="#B8F25C" />
              <Text style={styles.tagText}>Address Book & CRM</Text>
            </View>
          </View>
          <Text style={styles.title}>Customers & Suppliers</Text>
          <Text style={styles.subtitle}>Directory, balances, and communication history</Text>

          {/* Quick Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => router.push('/(app)/more/customers/new' as any)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={16} color="#0A1C16" />
              <Text style={styles.primaryActionBtnText}>Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => router.push('/(app)/more/suppliers/new' as any)}
              activeOpacity={0.8}
            >
              <Feather name="truck" size={14} color="#B8F25C" />
              <Text style={styles.secondaryActionBtnText}>Supplier</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contacts KPIs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.kpiScrollView}
          contentContainerStyle={styles.kpiContainer}
        >
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Total Customers</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Feather name="users" size={14} color="#3B82F6" />
              </View>
            </View>
            <Text style={styles.kpiValueBlue}>{customers.length}</Text>
            <Text style={styles.kpiSubtext}>Buyers & accounts</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Active Customers</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(184, 242, 92, 0.15)' }]}>
                <Feather name="trending-up" size={14} color="#B8F25C" />
              </View>
            </View>
            <Text style={styles.kpiValueGreen}>{activeCustomersCount}</Text>
            <Text style={styles.kpiSubtext}>Currently buying</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Total Suppliers</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Feather name="truck" size={14} color="#F59E0B" />
              </View>
            </View>
            <Text style={styles.kpiValueAmber}>{suppliers.length}</Text>
            <Text style={styles.kpiSubtext}>Vendors & partners</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Active Suppliers</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Feather name="check-circle" size={14} color="#38BDF8" />
              </View>
            </View>
            <Text style={styles.kpiValueSky}>{activeSuppliersCount}</Text>
            <Text style={styles.kpiSubtext}>Regular deliveries</Text>
          </View>
        </ScrollView>

        {/* Segmented Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'customers' && styles.tabChipActive]}
            onPress={() => setActiveTab('customers')}
          >
            <Feather
              name="user"
              size={14}
              color={activeTab === 'customers' ? '#B8F25C' : 'rgba(255,255,255,0.5)'}
            />
            <Text style={[styles.tabChipText, activeTab === 'customers' && styles.tabChipTextActive]}>
              Customers ({customers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'suppliers' && styles.tabChipActive]}
            onPress={() => setActiveTab('suppliers')}
          >
            <Feather
              name="truck"
              size={14}
              color={activeTab === 'suppliers' ? '#B8F25C' : 'rgba(255,255,255,0.5)'}
            />
            <Text style={[styles.tabChipText, activeTab === 'suppliers' && styles.tabChipTextActive]}>
              Suppliers ({suppliers.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab} by name, phone or email...`}
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

        {/* Content */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#B8F25C" />
            <Text style={styles.loadingText}>Syncing contacts directory...</Text>
          </View>
        ) : (
          <View style={styles.listFlex}>
            {activeTab === 'customers' && (
              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="users" size={40} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>No Customers Found</Text>
                    <Text style={styles.emptySubtext}>Tap + Customer to add your first client profile.</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isActive = item.status === 'active';
                  const isBusiness = item.customer_type === 'business';
                  return (
                    <TouchableOpacity
                      style={styles.contactCard}
                      activeOpacity={0.75}
                      onPress={() => router.push(`/(app)/more/customers/${item.id}` as any)}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>
                            {item.name ? item.name.charAt(0).toUpperCase() : 'C'}
                          </Text>
                        </View>
                        <View style={styles.contactInfo}>
                          <View style={styles.nameRow}>
                            <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
                            {isBusiness && (
                              <View style={styles.corpBadge}>
                                <Text style={styles.corpBadgeText}>B2B</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.contactPhone}>{item.phone || item.email || 'No contact details'}</Text>
                        </View>
                        <View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                          <Text style={[styles.statusBadgeText, isActive ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive]}>
                            {isActive ? 'Active' : (item.status || 'Client')}
                          </Text>
                        </View>
                      </View>

                      {/* Quick Communication Actions */}
                      <View style={styles.commActionRow}>
                        {item.phone && (
                          <TouchableOpacity
                            style={styles.commBtn}
                            onPress={() => handleCall(item.phone)}
                          >
                            <Feather name="phone" size={12} color="#B8F25C" />
                            <Text style={styles.commBtnText}>Call</Text>
                          </TouchableOpacity>
                        )}
                        {item.email && (
                          <TouchableOpacity
                            style={styles.commBtn}
                            onPress={() => handleEmail(item.email)}
                          >
                            <Feather name="mail" size={12} color="#79C0FF" />
                            <Text style={styles.commBtnText}>Email</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.commBtn, { marginLeft: 'auto' }]}
                          onPress={() => router.push(`/(app)/more/customers/${item.id}` as any)}
                        >
                          <Text style={styles.viewProfileText}>View Profile</Text>
                          <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            {activeTab === 'suppliers' && (
              <FlatList
                data={filteredSuppliers}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25C" />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="truck" size={40} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>No Suppliers Found</Text>
                    <Text style={styles.emptySubtext}>Tap + Supplier to record vendor information.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.contactCard}
                    activeOpacity={0.75}
                    onPress={() => router.push(`/(app)/more/suppliers/${item.id}` as any)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.avatarCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                        <Feather name="truck" size={16} color="#F59E0B" />
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{item.name}</Text>
                        <Text style={styles.contactPhone}>
                          {item.contact_person ? `Rep: ${item.contact_person} • ` : ''}
                          {item.phone || item.email || 'No contact details'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.commActionRow}>
                      {item.phone && (
                        <TouchableOpacity
                          style={styles.commBtn}
                          onPress={() => handleCall(item.phone)}
                        >
                          <Feather name="phone" size={12} color="#B8F25C" />
                          <Text style={styles.commBtnText}>Call</Text>
                        </TouchableOpacity>
                      )}
                      {item.email && (
                        <TouchableOpacity
                          style={styles.commBtn}
                          onPress={() => handleEmail(item.email)}
                        >
                          <Feather name="mail" size={12} color="#79C0FF" />
                          <Text style={styles.commBtnText}>Email</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.commBtn, { marginLeft: 'auto' }]}
                        onPress={() => router.push(`/(app)/more/suppliers/${item.id}` as any)}
                      >
                        <Text style={styles.viewProfileText}>View Supplier</Text>
                        <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}
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
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(184, 242, 92, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    color: '#B8F25C',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
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
    marginTop: 12,
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
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
  },
  kpiIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValueBlue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3B82F6',
  },
  kpiValueAmber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F59E0B',
  },
  kpiValueGreen: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B8F25C',
  },
  kpiValueSky: {
    fontSize: 16,
    fontWeight: '800',
    color: '#38BDF8',
  },
  kpiSubtext: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
  },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabChipActive: {
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  tabChipTextActive: {
    color: '#B8F25C',
    fontWeight: '700',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 18,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 40,
    marginBottom: 8,
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
  listFlex: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
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
  contactCard: {
    backgroundColor: 'rgba(20, 54, 40, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B8F25C',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  corpBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  corpBadgeText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(184, 242, 92, 0.12)',
  },
  statusBadgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: '#B8F25C',
  },
  statusBadgeTextInactive: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  commActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  commBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  commBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  viewProfileText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
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
});
