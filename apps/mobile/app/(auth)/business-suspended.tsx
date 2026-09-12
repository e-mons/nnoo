import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { AuthVideoBackground } from '../../components/AuthVideoBackground';
import { Button } from '../../components/Button';

export default function BusinessSuspendedScreen() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  const handleCreateNewBusiness = () => {
    router.replace('/(onboarding)/');
  };

  return (
    <AuthVideoBackground videoSource="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-lines-in-motion-41549-large.mp4">
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          {/* Header Region */}
          <View style={styles.headerRegion}>
            <Image 
              source={require('../../assets/images/logo-dark-horizontal.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Light Form Surface */}
          <View style={styles.surface}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚠️</Text>
            </View>

            <Text style={styles.title}>Business Suspended</Text>

            <Text style={styles.subtitle}>
              The business you are trying to access has been suspended by a platform administrator. 
              If you believe this is an error, please contact NNOO support.
            </Text>

            <View style={styles.buttonContainer}>
              <Button
                title="Create New Business"
                onPress={handleCreateNewBusiness}
                variant="outline"
                style={styles.createBtn}
              />

              <Button
                title="Sign Out"
                onPress={handleSignOut}
              />
            </View>
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
    justifyContent: 'flex-end',
  },
  headerRegion: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 40,
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
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A1C16',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
  },
  createBtn: {
    marginBottom: 16,
  },
});
