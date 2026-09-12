import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useBusiness } from '../../../contexts/BusinessContext';
import { supabase } from '../../../lib/supabase';
import * as Crypto from 'expo-crypto';
import { AuthVideoBackground } from '../../../components/AuthVideoBackground';
import { Button } from '../../../components/Button';
import { Feather } from '@expo/vector-icons';

export default function InvitationScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user } = useAuth();
  const { refreshMemberships, setActiveBusinessId } = useBusiness();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      // Re-hash the unhashed token provided in the URL to match the DB
      const tokenHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        token
      );

      const { data, error: rpcError } = await supabase.rpc('accept_business_invitation', {
        p_token_hash: tokenHash,
      });

      if (rpcError) {
        setError(rpcError.message);
      } else if (data?.business_id) {
        // Refresh context to load new membership
        await refreshMemberships();
        setActiveBusinessId(data.business_id);
        
        // Redirect to the newly joined business dashboard
        router.replace('/(app)/');
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred while accepting the invitation.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    router.replace('/(auth)/sign-in');
  };

  return (
    <AuthVideoBackground videoSource="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-lines-in-motion-41549-large.mp4">
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          {/* Header Region */}
          <View style={styles.headerRegion}>
            <Image 
              source={require('../../../assets/images/logo-dark-horizontal.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Light Form Surface */}
          <View style={styles.surface}>
            <View style={styles.iconContainer}>
              <Feather name="shield" size={32} color="#0A1C16" />
            </View>

            <Text style={styles.title}>Business Invitation</Text>

            <Text style={styles.subtitle}>
              You have been invited to join a team on NNOO.
            </Text>

            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {user ? (
              <View style={styles.contentBox}>
                <View style={styles.userBox}>
                  <Text style={styles.userLabel}>You are currently signed in as:</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>

                <Button
                  title="Accept Invitation"
                  onPress={handleAccept}
                  loading={loading}
                  style={styles.button}
                />
                
                <Text style={styles.note}>
                  Make sure this matches the email address the invitation was sent to.
                </Text>
              </View>
            ) : (
              <View style={styles.contentBox}>
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    You must be signed in to accept an invitation.
                  </Text>
                </View>

                <Button
                  title="Sign In or Create Account"
                  onPress={handleSignIn}
                  variant="outline"
                  style={styles.button}
                />
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </AuthVideoBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRegion: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    flex: 1,
  },
  logoImage: {
    width: 160,
    height: 44,
    marginBottom: 24,
  },
  surface: {
    backgroundColor: '#F9FBF9',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 2,
    borderColor: '#B8F25C',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#B8F25C',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#B8F25C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A1C16',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FF4D4D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  contentBox: {
    width: '100%',
  },
  userBox: {
    backgroundColor: 'rgba(10, 28, 22, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(10, 28, 22, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  userLabel: {
    fontSize: 13,
    color: '#4A5568',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A1C16',
  },
  warningBox: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  warningText: {
    color: '#A16207',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
  note: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    marginTop: 16,
  },
});
