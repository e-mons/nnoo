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
          fontWeight: '800',
          color: '#FFFFFF',
          fontSize: 18,
        },
        headerTintColor: '#FFFFFF',
        tabBarShowLabel: true,
        tabBarStyle: { 
          backgroundColor: '#06140F',
          borderTopWidth: 1,
          borderTopColor: 'rgba(184, 242, 92, 0.12)',
          height: 64 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
          elevation: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.45,
          shadowRadius: 18,
        },
        tabBarActiveTintColor: '#B8F25C',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.42)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
          letterSpacing: 0.3,
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
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Feather name="home" size={19} color={focused ? '#B8F25C' : 'rgba(255, 255, 255, 0.45)'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Money & Sales',
          tabBarLabel: 'Money',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Feather name="dollar-sign" size={19} color={focused ? '#B8F25C' : 'rgba(255, 255, 255, 0.45)'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Items & Stock',
          tabBarLabel: 'Stock',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Feather name="box" size={19} color={focused ? '#B8F25C' : 'rgba(255, 255, 255, 0.45)'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarLabel: 'More',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconBox, focused && styles.tabIconBoxActive]}>
              <Feather name="grid" size={19} color={focused ? '#B8F25C' : 'rgba(255, 255, 255, 0.45)'} />
            </View>
          ),
        }}
      />
      {/* Hide specific screens from Tab Bar (nested inside primary hubs) */}
      <Tabs.Screen
        name="invoices"
        options={{
          href: null,
          headerShown: false,
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
  tabIconBox: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBoxActive: {
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.3)',
  },
});
