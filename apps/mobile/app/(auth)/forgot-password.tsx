import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AuthVideoBackground } from '../../components/AuthVideoBackground';
import { emailSchema } from '@nnoo/validation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    return () => {
      Keyboard.dismiss();
    };
  }, []);

  const handleReset = async () => {
    Keyboard.dismiss();
    setError(null);
    
    // Validate input
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = Linking.createURL('reset-password');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        setError('Failed to send reset email. Please try again.');
      } else {
        setSuccess(true);
      }
    } catch (e) {
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthVideoBackground videoSource="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-data-41551-large.mp4">
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={true}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.innerContainer}>
                {/* Header Area */}
                <View style={styles.headerRegion}>
                  <Image 
                    source={require('../../assets/images/logo-dark-horizontal.png')} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.title}>Reset Password</Text>
                  <Text style={styles.subtitle}>
                    Enter your registered business email to recover your account.
                  </Text>
                </View>

                {/* Light Form Surface */}
                <View style={styles.surface}>
                  {error && (
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorBannerText}>{error}</Text>
                    </View>
                  )}

                  {success ? (
                    <View style={styles.successState}>
                      <View style={styles.iconCircle}>
                        <Text style={{ fontSize: 36 }}>✉️</Text>
                      </View>
                      <Text style={styles.successTitle}>Check Your Inbox</Text>
                      <Text style={styles.successText}>
                        If an account exists for <Text style={styles.highlightText}>{email}</Text>, password reset instructions have been dispatched.
                      </Text>
                      <Button
                        title="Return to Sign In"
                        onPress={() => {
                          Keyboard.dismiss();
                          router.replace('/(auth)/sign-in');
                        }}
                        style={styles.returnBtn}
                      />
                    </View>
                  ) : (
                    <View style={styles.form}>
                      <Input
                        label="Email Address"
                        placeholder="you@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        value={email}
                        onChangeText={setEmail}
                        editable={!loading}
                        iconName="mail"
                        returnKeyType="done"
                        onSubmitEditing={handleReset}
                      />

                      <Button
                        title="Send Reset Link"
                        onPress={handleReset}
                        loading={loading}
                        style={styles.submitBtn}
                      />

                      <View style={styles.footer}>
                        <Link 
                          href="/(auth)/sign-in" 
                          asChild
                          onPress={() => Keyboard.dismiss()}
                        >
                          <Text style={styles.footerLink}>← Back to Sign In</Text>
                        </Link>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthVideoBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  headerRegion: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 48,
  },
  logoImage: {
    width: 160,
    height: 44,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  surface: {
    backgroundColor: '#F9FBF9',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 2,
    borderColor: '#B8F25C',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  errorBanner: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FF4D4D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  errorBannerText: {
    color: '#FF4D4D',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  submitBtn: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLink: {
    color: '#0A1C16',
    fontSize: 14,
    fontWeight: '700',
  },
  successState: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EBFDE3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A1C16',
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  highlightText: {
    color: '#0A1C16',
    fontWeight: '700',
  },
  returnBtn: {
    width: '100%',
  },
});
