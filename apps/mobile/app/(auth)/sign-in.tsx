import React, { useState, useRef, useEffect } from 'react';
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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AuthVideoBackground } from '../../components/AuthVideoBackground';
import { signInSchema } from '@nnoo/validation';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; root?: string }>({});

  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => {
      Keyboard.dismiss();
    };
  }, []);

  const handleSignIn = async () => {
    Keyboard.dismiss();
    setErrors({});
    
    // Validate input matching web's signInAction
    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      setErrors({ root: 'Invalid form data.' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrors({ root: error.message });
      }
    } catch (e) {
      setErrors({ root: 'An unexpected error occurred. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthVideoBackground videoSource="https://assets.mixkit.co/videos/preview/mixkit-cashier-scanning-items-at-the-supermarket-checkout-42866-large.mp4">
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
                {/* Dark/Video Upper Region */}
                <View style={styles.headerRegion}>
                  <Image 
                    source={require('../../assets/images/logo-dark-horizontal.png')} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.title}>Welcome Back !</Text>
                  <Text style={styles.subtitle}>
                    Continue where you left off and stay on top of your business.
                  </Text>
                </View>

                {/* Light Form Surface (Bottom Sheet) */}
                <View style={styles.surface}>
                  {errors.root && (
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorBannerText}>{errors.root}</Text>
                    </View>
                  )}

                  <View style={styles.form}>
                    <Input
                      label="Email"
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      error={errors.email}
                      editable={!loading}
                      iconName="mail"
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => passwordRef.current?.focus()}
                    />

                    <Input
                      ref={passwordRef}
                      label="Password"
                      placeholder="Enter your password"
                      isPassword
                      value={password}
                      onChangeText={setPassword}
                      error={errors.password}
                      editable={!loading}
                      iconName="lock"
                      returnKeyType="done"
                      onSubmitEditing={handleSignIn}
                    />

                    <View style={styles.formOptionsRow}>
                      <View style={styles.rememberRow} />
                      <Link 
                        href="/(auth)/forgot-password" 
                        asChild
                        onPress={() => Keyboard.dismiss()}
                      >
                        <Text style={styles.forgotPassword}>Forgot Password?</Text>
                      </Link>
                    </View>

                    <Button
                      title="Log In"
                      onPress={handleSignIn}
                      loading={loading}
                      style={styles.submitBtn}
                    />

                    <View style={styles.footer}>
                      <Text style={styles.footerText}>Don't have an account? </Text>
                      <Link 
                        href="/(auth)/sign-up" 
                        asChild
                        onPress={() => Keyboard.dismiss()}
                      >
                        <Text style={styles.footerLink}>Sign Up</Text>
                      </Link>
                    </View>
                  </View>
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
  formOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: -8,
  },
  rememberRow: {
    flex: 1,
  },
  forgotPassword: {
    color: '#0A1C16',
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#4A5568',
    fontSize: 14,
  },
  footerLink: {
    color: '#0A1C16',
    fontSize: 14,
    fontWeight: '800',
  },
});
