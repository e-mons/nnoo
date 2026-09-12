import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useBusiness } from '../../../contexts/BusinessContext';
import { useAuth } from '../../../context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function MoreIndexScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();
  const { signOut } = useAuth();

  const operationsMenu = [
    { title: 'Customers', description: 'Manage customer details', route: '/(app)/more/customers', icon: 'users', color: '#3b82f6' },
    { title: 'Suppliers', description: 'Manage suppliers and contacts', route: '/(app)/more/suppliers', icon: 'truck', color: '#f59e0b' },
    { title: 'Products & Services', description: 'Manage your product catalogue', route: '/(app)/more/products', icon: 'package', color: '#10b981' },
    { title: 'Expenses', description: 'Record and track expenses', route: '/(app)/more/expenses', icon: 'credit-card', color: '#ef4444' },
  ];

  const intelligenceMenu = [
    { title: 'Intelligence Hub', description: 'AI tools and smart business insights', route: '/(app)/intelligence', icon: 'cpu', color: '#B8F25C' },
    { title: 'AI Bookkeeper', description: 'Classify and review transactions', route: '/(app)/intelligence/bookkeeper', icon: 'zap', color: '#f59e0b' },
    { title: 'Smart Insights', description: 'Verified business summaries', route: '/(app)/intelligence/insights', icon: 'trending-up', color: '#3b82f6' },
    { title: 'Ask NNOO', description: 'Chat with your business assistant', route: '/(app)/intelligence/assistant', icon: 'message-square', color: '#8b5cf6' },
    { title: 'Business Health', description: 'Operational health score', route: '/(app)/intelligence/health', icon: 'activity', color: '#10b981' },
    { title: 'Credit Passport', description: 'Verified business profile', route: '/(app)/intelligence/passport', icon: 'award', color: '#14b8a6' },
    { title: 'Automations', description: 'Scheduled intelligence jobs', route: '/(app)/intelligence/automations', icon: 'clock', color: '#6366f1' },
    { title: 'Notifications', description: 'Alerts and attention center', route: '/(app)/notifications', icon: 'bell', color: '#ec4899' },
    { title: 'WhatsApp', description: 'WhatsApp business integration', route: '/(app)/settings/whatsapp', icon: 'phone', color: '#22c55e' },
  ];

  const systemMenu = [
    { title: 'Team & Roles', description: 'Manage members and access permissions', route: '/(app)/team', icon: 'shield', color: '#B8F25C' },
    { title: 'Reports', description: 'Detailed financial statements', route: '/(app)/more/reports', icon: 'file-text', color: '#8b5cf6' },
    { title: 'Billing', description: 'Manage SaaS subscription', route: '/(app)/more/billing', icon: 'dollar-sign', color: '#14b8a6' },
    { title: 'Settings', description: 'Business and app settings', route: '/(app)/settings', icon: 'settings', color: '#64748b' },
  ];

  const handlePress = (item: any) => {
    if (item.route.includes('more/')) {
      router.push(item.route as any);
    } else {
      router.push(item.route as any);
    }
  };

  const renderMenuItem = (item: any, index: number, isLast: boolean) => (
    <TouchableOpacity 
      key={index} 
      style={[styles.menuItem, isLast && styles.menuItemLast]} 
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.iconBox, { backgroundColor: `${item.color}20` }]}>
          <Feather name={item.icon as any} size={20} color={item.color} />
        </View>
        <View>
          <Text style={styles.menuTitle}>{item.title}</Text>
          <Text style={styles.menuDesc}>{item.description}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A1C16', '#122E24', '#0A1C16']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>More Options</Text>
            <Text style={styles.subtext}>Manage {activeBusiness?.name} operations.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operations & Finance</Text>
            <BlurView intensity={20} tint="light" style={styles.menuCard}>
              {operationsMenu.map((item, index) => renderMenuItem(item, index, index === operationsMenu.length - 1))}
            </BlurView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Intelligence & AI</Text>
            <BlurView intensity={20} tint="light" style={styles.menuCard}>
              {intelligenceMenu.map((item, index) => renderMenuItem(item, index, index === intelligenceMenu.length - 1))}
            </BlurView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System & Configuration</Text>
            <BlurView intensity={20} tint="light" style={styles.menuCard}>
              {systemMenu.map((item, index) => renderMenuItem(item, index, index === systemMenu.length - 1))}
            </BlurView>
          </View>

          <TouchableOpacity 
            style={styles.signOutButton} 
            onPress={signOut}
            activeOpacity={0.7}
          >
            <Feather name="log-out" color="#FF4D4D" size={20} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 },
  header: { 
    marginBottom: 36,
    marginTop: 16,
  },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', marginBottom: 8, letterSpacing: -0.5 },
  subtext: { fontSize: 16, color: 'rgba(255,255,255,0.6)' },
  
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 16,
  },
  menuCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  menuDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
    marginTop: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4D4D',
  },
});
