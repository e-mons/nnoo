import React, { useState, useEffect, useRef } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AuthVideoBackground } from '../../components/AuthVideoBackground';
import { passwordSchema } from '@nnoo/validation';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [success, setSuccess] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const confirmPasswordRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => {
      Keyboard.dismiss();
    };
  }, []);

  useEffect(() => {
    async function setupSession() {
      const access_token = params.access_token as string;
      const refresh_token = params.refresh_token as string;

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          setSetupError('The password reset link is invalid or has expired. Please request a new one.');
        }
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setSetupError('Missing recovery information. Please request a new link.');
        }
      }
    }

    setupSession();
  }, [params]);

  const handleUpdatePassword = async () => {
    Keyboard.dismiss();
    setErrors({});
    
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      setErrors({ password: validation.error.errors[0].message });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErrors({ root: "We couldn't update your password. Please try again." });
      } else {
        setSuccess(true);
      }
    } catch (e) {
      setErrors({ root: 'An unexpected error occurred. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthVideoBackground videoSource="https://assets.mixkit.co/videos/preview/mixkit-green-code-lines-scrolling-down-a-screen-41552-large.mp4">
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
                  <Text style={styles.title}>New Password</Text>
                  <Text style={styles.subtitle}>
                    Set a strong, fresh password to protect your business account.
                  </Text>
                </View>

                {/* Light Form Surface */}
                <View style={styles.surface}>
                  {setupError ? (
                    <View style={styles.stateContainer}>
                      <View style={styles.alertIconCircle}>
                        <Text style={{ fontSize: 36 }}>⚠️</Text>
                      </View>
                      <Text style={styles.stateTitle}>Invalid or Expired Link</Text>
                      <Text style={styles.stateSubtitle}>{setupError}</Text>
                      <Button
                        title="Request New Link"
                        onPress={() => {
                          Keyboard.dismiss();
                          router.replace('/(auth)/forgot-password');
                        }}
                        style={styles.actionBtn}
                      />
                    </View>
                  ) : success ? (
                    <View style={styles.stateContainer}>
                      <View style={styles.successIconCircle}>
                        <Text style={{ fontSize: 36 }}>✅</Text>
                      </View>
                      <Text style={styles.stateTitle}>Password Updated!</Text>
                      <Text style={styles.stateSubtitle}>
                        Your business credentials have been updated securely.
                      </Text>
                      <Button
                        title="Go to Dashboard"
                        onPress={() => {
                          Keyboard.dismiss();
                          router.replace('/(app)/');
                        }}
                        style={styles.actionBtn}
                      />
                    </View>
                  ) : (
                    <View style={styles.form}>
                      {errors.root && (
                        <View style={styles.errorBanner}>
                          <Text style={styles.errorBannerText}>{errors.root}</Text>
                        </View>
                      )}

                      <Input
                        label="New Password"
                        placeholder="Create a new password"
                        isPassword
                        value={password}
                        onChangeText={setPassword}
                        error={errors.password}
                        editable={!loading}
                        iconName="lock"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                      />

                      <Input
                        ref={confirmPasswordRef}
                        label="Confirm New Password"
                        placeholder="Repeat your new password"
                        isPassword
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        error={errors.confirmPassword}
                        editable={!loading}
                        iconName="lock"
                        returnKeyType="done"
                        onSubmitEditing={handleUpdatePassword}
                      />

                      <Button
                        title="Update Password"
                        onPress={handleUpdatePassword}
                        loading={loading}
                        style={styles.submitBtn}
                      />
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
    paddingBottom: 40,
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
    marginTop: 16,
    marginBottom: 24,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  alertIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(184, 242, 92, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 92, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A1C16',
    marginBottom: 12,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  actionBtn: {
    width: '100%',
  },
});
