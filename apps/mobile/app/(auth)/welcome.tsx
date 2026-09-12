import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { AuthVideoBackground } from '../../components/AuthVideoBackground';

export default function WelcomeScreen() {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <AuthVideoBackground videoSource={require('../../assets/videos/vid1.mp4')}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Animated.View 
            style={[
              styles.textContainer, 
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <Image 
              source={require('../../assets/images/logo-dark-horizontal.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Run your business with clarity.</Text>
            <Text style={styles.subtitle}>
              Sales, expenses, inventory and business insights — all in one place.
            </Text>
          </Animated.View>

          <Animated.View 
            style={[
              styles.actionContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <Button
              title="Get Started"
              onPress={() => router.push('/(auth)/sign-up')}
              style={styles.primaryBtn}
            />
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Text 
                style={styles.footerLink} 
                onPress={() => router.push('/(auth)/sign-in')}
              >
                Sign In
              </Text>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </AuthVideoBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  textContainer: {
    marginBottom: 48,
  },
  logoImage: {
    width: 200,
    height: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -1,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 24,
    fontWeight: '400',
  },
  actionContainer: {
    width: '100%',
  },
  primaryBtn: {
    marginBottom: 32,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  footerLink: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
