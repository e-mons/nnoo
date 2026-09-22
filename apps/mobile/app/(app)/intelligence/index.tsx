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
      <Stack.Screen options={{ title: 'AI Advisor & Health', headerShown: true }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.tag}>
            <Feather name="zap" size={12} color="#B8F25C" />
            <Text style={styles.tagText}>AI Business Advisor & Intelligence</Text>
          </View>
          <Text style={styles.title}>AI Advisor & Health</Text>
          <Text style={styles.subtitle}>
            Chat with Ask NNOO, review business health, and generate verified credit passports.
          </Text>

          {/* Quick Suggestion Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            <TouchableOpacity
              style={styles.chip}
              onPress={() => router.push('/(app)/intelligence/assistant')}
            >
              <Text style={styles.chipText}>💬 &quot;How much profit this week?&quot;</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, styles.chipPassport]}
              onPress={() => router.push('/(app)/intelligence/passport')}
            >
              <Feather name="award" size={12} color="#79C0FF" />
              <Text style={[styles.chipText, { color: '#79C0FF' }]}>Get Loan Passport</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, styles.chipHealth]}
              onPress={() => router.push('/(app)/intelligence/health')}
            >
              <Feather name="heart" size={12} color="#F25C8A" />
              <Text style={[styles.chipText, { color: '#F25C8A' }]}>Health Score</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Hero Plain-English Advisory Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroCardHeader}>
              <View style={styles.heroIconBox}>
                <Feather name="shield" size={18} color="#B8F25C" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.heroTitleRow}>
                  <Text style={styles.heroTitle}>Business Intelligence Center</Text>
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>Active</Text>
                  </View>
                </View>
                <Text style={styles.heroDesc}>
                  NNOO continuously checks your sales, margins, expenses, and invoices to give you verified advice with zero guesswork.
                </Text>
              </View>
            </View>
          </View>
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
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(184, 242, 92, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  tagText: {
    color: '#B8F25C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chipPassport: {
    backgroundColor: 'rgba(121, 192, 255, 0.12)',
    borderColor: 'rgba(121, 192, 255, 0.25)',
  },
  chipHealth: {
    backgroundColor: 'rgba(242, 92, 138, 0.12)',
    borderColor: 'rgba(242, 92, 138, 0.25)',
  },
  heroCard: {
    backgroundColor: 'rgba(20, 54, 40, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.25)',
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
  },
  heroCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activePill: {
    backgroundColor: '#B8F25C',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0A1C16',
  },
  heroDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 16,
  },
});
