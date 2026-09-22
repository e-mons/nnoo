import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useBusiness } from '../../../contexts/BusinessContext';
import { useAuth } from '../../../context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface MenuItem {
  title: string;
  description: string;
  route: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

export default function MoreIndexScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const { user, signOut } = useAuth();

  const directoryMenu: MenuItem[] = [
    {
      title: 'Contacts & Debt Directory',
      description: 'Customers, suppliers, and who owes you money',
      route: '/(app)/more/contacts',
      icon: 'users',
      color: '#79C0FF',
    },
    {
      title: 'Official Payment Receipts',
      description: 'Historical customer payment receipts & records',
      route: '/(app)/more/receipts',
      icon: 'check-circle',
      color: '#B8F25C',
    },
    {
      title: 'Business Performance Reports',
      description: 'Profit, loss, sales summaries, and statements',
      route: '/(app)/more/reports',
      icon: 'bar-chart-2',
      color: '#F0883E',
    },
  ];

  const smartToolsMenu: MenuItem[] = [
    {
      title: 'AI Advisor & Intelligence Hub',
      description: 'AI Bookkeeper, smart recommendations & health score',
      route: '/(app)/intelligence',
      icon: 'cpu',
      color: '#B8F25C',
    },
    {
      title: 'WhatsApp Business Integration',
      description: 'Send invoices, receipts, and payment links via WhatsApp',
      route: '/(app)/settings/whatsapp',
      icon: 'message-circle',
      color: '#22C55E',
    },
    {
      title: 'Attention & Alert Center',
      description: 'Pending payments, stock alerts, and urgent reminders',
      route: '/(app)/notifications',
      icon: 'bell',
      color: '#EC4899',
    },
  ];

  const settingsMenu: MenuItem[] = [
    {
      title: 'Business Profile & Details',
      description: 'Store name, logo, contact phone, and receipt header',
      route: '/(app)/settings',
      icon: 'settings',
      color: '#94A3B8',
    },
    {
      title: 'Staff & Team Permissions',
      description: 'Manage cashiers, managers, and access roles',
      route: '/(app)/team',
      icon: 'shield',
      color: '#B8F25C',
    },
    {
      title: 'Alerts & Notifications Settings',
      description: 'Push notification sound, reminders, and daily digests',
      route: '/(app)/settings/notifications',
      icon: 'sliders',
      color: '#79C0FF',
    },
    {
      title: 'Subscription & Plan',
      description: 'Current business tier, renewal, and usage limits',
      route: '/(app)/more/billing',
      icon: 'credit-card',
      color: '#F59E0B',
    },
  ];

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  const renderSectionCard = (items: MenuItem[]) => (
    <View style={styles.cardContainer}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <TouchableOpacity
            key={item.route}
            style={[styles.menuItem, isLast && styles.menuItemLast]}
            onPress={() => handlePress(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: `${item.color}1A` }]}>
                <Feather name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDesc}>{item.description}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A1C16', '#0F261E', '#0A1C16']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.tag}>
              <Feather name="grid" size={12} color="#B8F25C" />
              <Text style={styles.tagText}>Directory & Settings</Text>
            </View>
            <Text style={styles.headerTitle}>More Options</Text>
            <Text style={styles.subtext}>Everything else for your daily operations</Text>
          </View>

          {/* Active Business Mini Card */}
          {activeBusiness && (
            <View style={styles.businessProfileCard}>
              <View style={styles.businessAvatar}>
                <Text style={styles.businessAvatarText}>
                  {activeBusiness.name?.charAt(0)?.toUpperCase() || 'B'}
                </Text>
              </View>
              <View style={styles.businessMeta}>
                <Text style={styles.businessName} numberOfLines={1}>
                  {activeBusiness.name}
                </Text>
                <Text style={styles.businessEmail} numberOfLines={1}>
                  {user?.email || 'Active Store'}
                </Text>
              </View>
              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activePillText}>Online</Text>
              </View>
            </View>
          )}

          {/* Group 1: Business Directory */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Directory</Text>
            {renderSectionCard(directoryMenu)}
          </View>

          {/* Group 2: Smart Business Tools */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Smart Tools & AI</Text>
            {renderSectionCard(smartToolsMenu)}
          </View>

          {/* Group 3: Settings & Team */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings & Organization</Text>
            {renderSectionCard(settingsMenu)}
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={signOut}
            activeOpacity={0.8}
          >
            <Feather name="log-out" color="#FF6B6B" size={18} />
            <Text style={styles.signOutText}>Sign Out of Account</Text>
          </TouchableOpacity>
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 18,
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
  headerTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.58)',
    marginTop: 3,
  },
  businessProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 54, 40, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  businessAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessAvatarText: {
    color: '#B8F25C',
    fontSize: 18,
    fontWeight: '900',
  },
  businessMeta: {
    flex: 1,
  },
  businessName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  businessEmail: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 1,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(184, 242, 92, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B8F25C',
  },
  activePillText: {
    color: '#B8F25C',
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
  },
  cardContainer: {
    borderRadius: 16,
    backgroundColor: 'rgba(20, 54, 40, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  menuDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 15,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.25)',
    marginTop: 4,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF6B6B',
  },
});
