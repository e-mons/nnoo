import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { BusinessProvider, useBusiness } from '../contexts/BusinessContext';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';

// Set up deep linking prefix
const prefix = Linking.createURL('/');

function RootLayoutNav() {
  const { session, profile, isLoading: authLoading } = useAuth();
  const { memberships, hasSuspendedBusiness, isLoading: businessLoading } = useBusiness();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const isLoading = authLoading || businessLoading;

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inAppGroup = segments[0] === '(app)';
    const authRoute = (segments as string[])[1];
    const isSuspendedPage = inAuthGroup && authRoute === 'suspended';
    
    if (!session && !inAuthGroup) {
      // Redirect to the welcome page.
      router.replace('/(auth)/welcome');
    } else if (session) {
      if (profile?.account_status === 'suspended' && !isSuspendedPage) {
        router.replace('/(auth)/suspended');
      } else if (profile?.account_status !== 'suspended') {
        if (memberships.length === 0 && !inOnboardingGroup) {
          if (hasSuspendedBusiness) {
            router.replace('/(auth)/business-suspended');
          } else {
            // Redirect to onboarding
            router.replace('/(onboarding)/');
          }
        } else if (memberships.length > 0 && !inAppGroup) {
          // Redirect to app
          router.replace('/(app)/');
        }
      }
    }
  }, [session, profile, memberships, hasSuspendedBusiness, isLoading, segments, router, rootNavigationState?.key]);

  // Deep linking for password recovery or email verification or invitations
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const handleDeepLink = (event: { url: string }) => {
      const data = Linking.parse(event.url);
      
      if (data.path === 'reset-password' && data.queryParams) {
        // Typically, Supabase intercepts this via detectSessionInUrl, but since we disabled it,
        // we can handle tokens here or let it be. Wait, if it's disabled, Supabase won't intercept.
        // We might just route the user to the reset password page and pass parameters.
        const access_token = data.queryParams.access_token;
        const refresh_token = data.queryParams.refresh_token;
        if (access_token && refresh_token) {
          router.replace({
            pathname: '/(auth)/reset-password',
            params: { access_token: String(access_token), refresh_token: String(refresh_token) }
          });
        }
      } else if (data.path && data.path.includes('invitations/')) {
        const parts = data.path.split('/').filter(Boolean);
        const inviteIdx = parts.indexOf('invitations');
        const token = inviteIdx !== -1 ? parts[inviteIdx + 1] : null;
        if (token) {
          router.replace({
            pathname: '/(auth)/invitations/[token]',
            params: { token: String(token) }
          });
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check initial URL
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription.remove();
    };
  }, [router, rootNavigationState?.key]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B8F25C" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BusinessProvider>
          <RootLayoutNav />
        </BusinessProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A1C16', // NNOO brand dark background
  },
});
