import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { AuthVideoBackground } from '../../components/AuthVideoBackground';
import { signUpSchema } from '@nnoo/validation';
import { Feather } from '@expo/vector-icons';

export default function SignUpScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => {
      Keyboard.dismiss();
    };
  }, []);

  const handleSignUp = async () => {
    Keyboard.dismiss();
    setErrors({});
    
    if (!agreed) {
      setErrors({ agreed: 'You must agree to the Terms & Conditions and Privacy Policy.' });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    // Validate input
    const validation = signUpSchema.safeParse({ email, password, firstName, lastName });
    if (!validation.success) {
      const fieldErrors: any = {};
      validation.error.errors.forEach((err) => {
        const path = err.path[0];
        if (path) {
          fieldErrors[path] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: Linking.createURL('/(auth)/verify-email'),
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        let safeMessage = "We couldn't create your account. Please check your details and try again.";
        if (error.message.includes('already registered')) {
          safeMessage = 'An account with this email already exists.';
        }
        setErrors({ root: safeMessage });
      } else if (data?.session) {
        router.replace('/(app)/');
      } else {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email },
        });
      }
    } catch (e) {
      setErrors({ root: 'An unexpected error occurred. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthVideoBackground videoSource="https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-at-a-coffee-shop-counter-42875-large.mp4">
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
                {/* Header */}
                <View style={styles.headerRegion}>
                  <Image 
                    source={require('../../assets/images/logo-dark-horizontal.png')} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.title}>Create Account</Text>
                  <Text style={styles.subtitle}>
                    Step into a place where business meets performance and growth.
                  </Text>
                </View>

                {/* Light Form Surface */}
                <View style={styles.surface}>
                  {errors.root && (
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorBannerText}>{errors.root}</Text>
                    </View>
                  )}

                  <View style={styles.form}>
                    <View style={styles.nameRow}>
                      <View style={styles.nameCol}>
                        <Input
                          label="First Name"
                          placeholder="Jane"
                          value={firstName}
                          onChangeText={setFirstName}
                          error={errors.firstName}
                          editable={!loading}
                          iconName="user"
                          returnKeyType="next"
                          blurOnSubmit={false}
                          onSubmitEditing={() => lastNameRef.current?.focus()}
                        />
                      </View>
                      <View style={styles.nameCol}>
                        <Input
                          ref={lastNameRef}
                          label="Last Name"
                          placeholder="Doe"
                          value={lastName}
                          onChangeText={setLastName}
                          error={errors.lastName}
                          editable={!loading}
                          iconName="user"
                          returnKeyType="next"
                          blurOnSubmit={false}
                          onSubmitEditing={() => emailRef.current?.focus()}
                        />
                      </View>
                    </View>

                    <Input
                      ref={emailRef}
                      label="Email Address"
                      placeholder="davidjohnson@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
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
                      placeholder="Min. 8 characters"
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
                      label="Confirm Password"
                      placeholder="Confirm password"
                      isPassword
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      error={errors.confirmPassword}
                      editable={!loading}
                      iconName="lock"
                      returnKeyType="done"
                      onSubmitEditing={handleSignUp}
                    />

                    <TouchableOpacity 
                      style={styles.checkboxContainer} 
                      onPress={() => {
                        Keyboard.dismiss();
                        setAgreed(!agreed);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                        {agreed && <Feather name="check" size={14} color="#0A1C16" />}
                      </View>
                      <Text style={styles.termsText}>
                        I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                      </Text>
                    </TouchableOpacity>
                    {errors.agreed && (
                      <Text style={styles.checkboxError}>{errors.agreed}</Text>
                    )}

                    <Button
                      title="Create Account"
                      onPress={handleSignUp}
                      loading={loading}
                      style={styles.submitBtn}
                    />

                    <View style={styles.footer}>
                      <Text style={styles.footerText}>Already have an account? </Text>
                      <Link 
                        href="/(auth)/sign-in" 
                        asChild 
                        onPress={() => Keyboard.dismiss()}
                      >
                        <Text style={styles.footerLink}>Sign In</Text>
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
    paddingBottom: 32,
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
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  nameCol: {
    width: '48%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: -8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(10, 28, 22, 0.3)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#B8F25C',
    borderColor: '#B8F25C',
  },
  termsText: {
    color: '#4A5568',
    fontSize: 13,
    flex: 1,
  },
  termsLink: {
    color: '#0A1C16',
    fontWeight: '700',
  },
  checkboxError: {
    color: '#FF4D4D',
    fontSize: 12,
    marginTop: -16,
    marginBottom: 20,
    fontWeight: '500',
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
