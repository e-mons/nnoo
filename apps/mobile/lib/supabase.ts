import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus, Platform } from 'react-native';

// ─── Chunked Secure Storage Adapter ──────────────────────────────────
// Expo SecureStore has a 2048-byte limit on Android keystore entries.
// Full Supabase session JSON payloads often exceed 2KB.
// This adapter safely splits large payloads into transparent chunks.

const CHUNK_SIZE = 1800; // safely below the 2048-byte platform limit

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return null;
    try {
      // First check for multi-part chunked value
      const countStr = await SecureStore.getItemAsync(`${key}_count`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        let fullValue = '';
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
          if (chunk === null) return null;
          fullValue += chunk;
        }
        return fullValue || null;
      }

      // Fall back to standard key (for single-part / legacy values)
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn('SecureStore getItem error:', e);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      if (value.length <= CHUNK_SIZE) {
        // Clean up any previously stored chunks
        const prevCountStr = await SecureStore.getItemAsync(`${key}_count`);
        if (prevCountStr) {
          const prevCount = parseInt(prevCountStr, 10);
          for (let i = 0; i < prevCount; i++) {
            await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
          }
          await SecureStore.deleteItemAsync(`${key}_count`);
        }
        await SecureStore.setItemAsync(key, value);
      } else {
        // Delete legacy monolithic key if it exists
        await SecureStore.deleteItemAsync(key);

        const chunks = Math.ceil(value.length / CHUNK_SIZE);
        await SecureStore.setItemAsync(`${key}_count`, chunks.toString());

        for (let i = 0; i < chunks; i++) {
          const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk);
        }
      }
    } catch (e) {
      console.warn('SecureStore setItem error:', e);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      await SecureStore.deleteItemAsync(key);
      const countStr = await SecureStore.getItemAsync(`${key}_count`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
        }
        await SecureStore.deleteItemAsync(`${key}_count`);
      }
    } catch (e) {
      console.warn('SecureStore removeItem error:', e);
    }
  },
};

// ─── Environment ─────────────────────────────────────────────────────
// Only EXPO_PUBLIC_ prefixed variables are bundled into the mobile app.
// Server secrets must NEVER appear here.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. '
    + 'Set these in your Expo environment configuration.'
  );
}

// ─── Supabase Client ─────────────────────────────────────────────────

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // deep-link auth handled separately
  },
});

// ─── Auto-refresh on App Focus ───────────────────────────────────────

AppState.addEventListener('change', (state: AppStateStatus) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
