import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useBusiness } from '../../../contexts/BusinessContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { MOBILE_ACTION_ROUTE_MAP, type MobileActionKey } from '@nnoo/contracts';

type NotificationItem = {
  id: string;
  notification_category: string;
  notification_type: string;
  title: string;
  body: string;
  primary_action_key: string;
  created_at: string;
  read_at: string | null;
  resolved_at: string | null;
};

const CATEGORY_ICONS: Record<string, { icon: keyof typeof Feather.glyphMap; color: string }> = {
  INVENTORY: { icon: 'box', color: '#F2925C' },
  INVOICES: { icon: 'file-text', color: '#5CB8F2' },
  BOOKKEEPER: { icon: 'book-open', color: '#B8F25C' },
  BUSINESS_HEALTH: { icon: 'heart', color: '#F25C8A' },
  CREDIT_PASSPORT: { icon: 'award', color: '#F2C85C' },
  BUSINESS_SUMMARIES: { icon: 'bar-chart-2', color: '#5CF2B8' },
  AUTOMATIONS: { icon: 'zap', color: '#C85CF2' },
};

export default function NotificationCenterScreen() {
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!activeBusiness || !user) return;
    try {
      const { data, error } = await supabase
        .from('business_notifications')
        .select('id, notification_category, notification_type, title, body, primary_action_key, created_at, read_at, resolved_at')
        .eq('business_id', activeBusiness.id)
        .eq('recipient_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      const items = data || [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read_at).length);
    } catch {
      // Silent fail — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBusiness, user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('business_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleTap = (item: NotificationItem) => {
    if (!item.read_at) markAsRead(item.id);

    const route = MOBILE_ACTION_ROUTE_MAP[item.primary_action_key as MobileActionKey];
    if (route) router.push(route as `/${string}`);
  };

  const markAllRead = async () => {
    if (!activeBusiness || !user) return;
    await supabase
      .from('business_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('business_id', activeBusiness.id)
      .eq('recipient_user_id', user.id)
      .is('read_at', null);

    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    setUnreadCount(0);
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const catInfo = CATEGORY_ICONS[item.notification_category] || { icon: 'bell' as const, color: '#888' };
    const isUnread = !item.read_at;

    return (
      <TouchableOpacity
        style={[styles.notifCard, isUnread && styles.unreadCard]}
        onPress={() => handleTap(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.notifIcon, { backgroundColor: catInfo.color + '20' }]}>
          <Feather name={catInfo.icon} size={18} color={catInfo.color} />
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, isUnread && styles.unreadTitle]}>{item.title}</Text>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.notifDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerShown: true,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.push('/(app)/notifications/preferences')}>
                <Feather name="settings" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllRead}>
                  <Feather name="check-circle" size={20} color="#B8F25C" />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#B8F25C" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.center}>
            <Feather name="bell-off" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor="#B8F25C" />}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1C16' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 15, marginTop: 12 },
  headerActions: { flexDirection: 'row', gap: 16, marginRight: 8 },
  list: { padding: 16 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    gap: 12,
    position: 'relative',
  },
  unreadCard: { backgroundColor: 'rgba(184,242,92,0.06)', borderWidth: 1, borderColor: 'rgba(184,242,92,0.1)' },
  notifIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  unreadTitle: { color: '#FFFFFF', fontWeight: '700' },
  notifBody: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 18 },
  notifDate: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#B8F25C', position: 'absolute', top: 16, right: 16 },
});
