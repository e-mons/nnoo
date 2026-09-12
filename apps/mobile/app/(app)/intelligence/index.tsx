import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SmartToolCard {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  route: string;
}

const SMART_TOOLS: SmartToolCard[] = [
  {
    key: 'bookkeeper',
    title: 'AI Bookkeeper',
    description: 'Review & confirm AI-classified transactions',
    icon: 'book-open',
    color: '#B8F25C',
    route: '/(app)/intelligence/bookkeeper',
  },
  {
    key: 'insights',
    title: 'Smart Insights',
    description: 'Verified business summaries & metrics',
    icon: 'bar-chart-2',
    color: '#5CF2B8',
    route: '/(app)/intelligence/insights',
  },
  {
    key: 'assistant',
    title: 'Ask NNOO',
    description: 'AI business assistant — ask anything',
    icon: 'message-circle',
    color: '#5CB8F2',
    route: '/(app)/intelligence/assistant',
  },
  {
    key: 'health',
    title: 'Business Health',
    description: 'Score across 5 health dimensions',
    icon: 'heart',
    color: '#F25C8A',
    route: '/(app)/intelligence/health',
  },
  {
    key: 'passport',
    title: 'Credit Passport',
    description: 'Shareable verified creditworthiness report',
    icon: 'award',
    color: '#F2C85C',
    route: '/(app)/intelligence/passport',
  },
  {
    key: 'automations',
    title: 'Automations',
    description: 'Scheduled jobs & business rules',
    icon: 'zap',
    color: '#C85CF2',
    route: '/(app)/intelligence/automations',
  },
  {
    key: 'notifications',
    title: 'Notifications',
    description: 'Alerts, attention items & preferences',
    icon: 'bell',
    color: '#F2925C',
    route: '/(app)/notifications',
  },
  {
    key: 'whatsapp',
    title: 'WhatsApp',
    description: 'Business alerts via WhatsApp',
    icon: 'smartphone',
    color: '#25D366',
    route: '/(app)/settings/whatsapp',
  },
];

export default function IntelligenceHubScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: 'Smart Tools', headerShown: true }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Smart Tools</Text>
          <Text style={styles.subtitle}>
            AI-powered tools to understand, manage, and grow your business
          </Text>
        </View>

        <View style={styles.grid}>
          {SMART_TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.key}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push(tool.route as `/${string}`)}
            >
              <View style={[styles.iconContainer, { backgroundColor: tool.color + '20' }]}>
                <Feather name={tool.icon} size={24} color={tool.color} />
              </View>
              <Text style={styles.cardTitle}>{tool.title}</Text>
              <Text style={styles.cardDescription}>{tool.description}</Text>
              <View style={styles.cardArrow}>
                <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.3)" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1C16',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 22,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.1)',
    position: 'relative',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
    paddingRight: 24,
  },
  cardArrow: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
});
