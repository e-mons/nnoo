import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';
import { AuthVideoBackground } from '../../components/AuthVideoBackground';
import { verifyEmailOtpSchema, resendOtpSchema } from '@nnoo/validation';
import { Feather } from '@expo/vector-icons';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const [email, setEmail] = useState(params.email || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => {
      Keyboard.dismiss();
    };
  }, []);

  useEffect(() => {
    if (params.email) {
      setEmail(params.email);
    }
  }, [params.email]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  const handleVerify = async () => {
    Keyboard.dismiss();
    setError(null);
    setResendSuccess(false);

    const validation = verifyEmailOtpSchema.safeParse({ email, token: code });
    if (!validation.success) {
      setError(validation.error.errors[0]?.message || 'Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup',
      });

      if (verifyError) {
        setError(verifyError.message || 'Invalid or expired verification code.');
        setLoading(false);
        return;
      }

      if (data?.session || data?.user) {
        // User is now verified and authenticated
        router.replace('/(app)/');
      } else {
        router.replace('/(auth)/sign-in');
      }
    } catch {
      setError('An unexpected error occurred during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending || !email) return;

    Keyboard.dismiss();
    setError(null);
    setResending(true);
    setResendSuccess(false);

    const validation = resendOtpSchema.safeParse({ email });
    if (!validation.success) {
      setError('Please provide a valid email address.');
      setResending(false);
      return;
    }

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (resendError) {
        setError(resendError.message || 'Failed to resend code.');
      } else {
        setResendSuccess(true);
        setCanResend(false);
        setCountdown(60);
      }
    } catch {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthVideoBackground videoSource="https://assets.mixkit.co/videos/preview/mixkit-futuristic-holographic-interface-in-a-dark-room-41550-large.mp4">
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
                {/* Header Region */}
                <View style={styles.headerRegion}>
                  <Image 
                    source={require('../../assets/images/logo-dark-horizontal.png')} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.headerTitle}>Verify Email</Text>
                  <Text style={styles.headerSubtitle}>
                    Enter the 6-digit code sent to your email to continue.
                  </Text>
                </View>

                {/* Light Form Surface */}
                <View style={styles.surface}>
                  <View style={styles.iconContainer}>
                    <Feather name="shield" size={32} color="#0A1C16" />
                  </View>

                  <Text style={styles.title}>Enter Verification Code</Text>

                  <Text style={styles.subtitle}>
                    We sent a 6-digit code to:
                    {'\n'}
                    <Text style={styles.emailText}>{email || 'your email address'}</Text>
                  </Text>

                  {error && (
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorBannerText}>{error}</Text>
                    </View>
                  )}

                  {resendSuccess && (
                    <View style={styles.successBanner}>
                      <Text style={styles.successText}>A fresh verification code has been dispatched to your email.</Text>
                    </View>
                  )}

                  {!params.email && (
                    <View style={styles.emailInputWrapper}>
                      <Text style={styles.inputLabel}>Email Address</Text>
                      <TextInput
                        style={styles.emailTextInput}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        placeholderTextColor="rgba(10, 28, 22, 0.3)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    </View>
                  )}

                  {/* 6-Digit Visual Input Boxes */}
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => inputRef.current?.focus()}
                    style={styles.otpContainer}
                  >
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const digit = code[index] || '';
                      const isCurrent = code.length === index;
                      return (
                        <View
                          key={index}
                          style={[
                            styles.otpBox,
                            isCurrent && styles.otpBoxFocused,
                            !!digit && styles.otpBoxFilled,
                          ]}
                        >
                          <Text style={styles.otpDigit}>{digit}</Text>
                        </View>
                      );
                    })}
                  </TouchableOpacity>

                  {/* Hidden Real TextInput for Native Keyboard / Autofill */}
                  <TextInput
                    ref={inputRef}
                    style={styles.hiddenInput}
                    value={code}
                    onChangeText={(text) => {
                      const clean = text.replace(/\D/g, '').slice(0, 6);
                      setCode(clean);
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                    returnKeyType="done"
                    onSubmitEditing={handleVerify}
                    autoFocus
                  />

                  <Button
                    title={loading ? 'Verifying...' : 'Verify & Continue'}
                    onPress={handleVerify}
                    loading={loading}
                    disabled={code.length !== 6 || loading}
                    style={styles.verifyBtn}
                  />

                  {/* Resend Section */}
                  <View style={styles.resendSection}>
                    <Text style={styles.resendPrompt}>Didn&apos;t receive the code?</Text>
                    <TouchableOpacity
                      onPress={handleResend}
                      disabled={!canResend || resending}
                      style={styles.resendBtn}
                    >
                      {resending ? (
                        <ActivityIndicator size="small" color="#0A1C16" />
                      ) : (
                        <Text style={[styles.resendBtnText, !canResend && styles.resendBtnTextDisabled]}>
                          {canResend ? 'Resend Code' : `Resend code in ${countdown}s`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.footer}>
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        router.replace('/(auth)/sign-in');
                      }}
                    >
                      <Text style={styles.footerLink}>← Back to Sign In</Text>
                    </TouchableOpacity>
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
    paddingBottom: 32,
  },
  logoImage: {
    width: 160,
    height: 44,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
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
    alignItems: 'center',
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#B8F25C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#B8F25C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A1C16',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emailText: {
    color: '#0A1C16',
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FF4D4D',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorBannerText: {
    color: '#FF4D4D',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  successBanner: {
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    borderWidth: 1,
    borderColor: '#143628',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  successText: {
    color: '#143628',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  emailInputWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#143628',
    marginBottom: 6,
    marginLeft: 4,
  },
  emailTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(10, 28, 22, 0.1)',
    borderRadius: 20,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0A1C16',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    marginTop: 8,
    width: '100%',
  },
  otpBox: {
    width: 46,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(10, 28, 22, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFocused: {
    borderColor: '#B8F25C',
    backgroundColor: '#FFFFFF',
    shadowColor: '#B8F25C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  otpBoxFilled: {
    borderColor: '#0A1C16',
    backgroundColor: '#FFFFFF',
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A1C16',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  verifyBtn: {
    width: '100%',
    marginBottom: 20,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendPrompt: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 6,
  },
  resendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A1C16',
    textDecorationLine: 'underline',
  },
  resendBtnTextDisabled: {
    color: '#A0AEC0',
    textDecorationLine: 'none',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(10, 28, 22, 0.08)',
    paddingTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  footerLink: {
    color: '#0A1C16',
    fontSize: 14,
    fontWeight: '700',
  },
});
