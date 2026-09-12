import { Tabs } from 'expo-router';
import { useBusiness } from '../../contexts/BusinessContext';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppLayout() {
  const { activeBusiness } = useBusiness();
  const insets = useSafeAreaInsets();

  if (!activeBusiness) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No active business selected.</Text>
      </View>
    );
  }

  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 24 : 12);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { 
          backgroundColor: '#0A1C16',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: '#FFFFFF',
        },
        headerTintColor: '#FFFFFF',
        tabBarShowLabel: true,
        tabBarStyle: { 
          backgroundColor: '#06130E',
          borderTopWidth: 1,
          borderTopColor: 'rgba(184, 242, 92, 0.15)',
          height: 60 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
        },
        tabBarActiveTintColor: '#B8F25C',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.45)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 3,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="trending-up" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="box" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: 'Invoices',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="file-text" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="grid" size={22} color={color} />
          ),
        }}
      />
      {/* Hide specific screens from Tab Bar */}
      <Tabs.Screen
        name="intelligence"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          href: null,
        }}
      />
    </Tabs>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1C16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
});
