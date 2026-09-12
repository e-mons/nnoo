import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { INDUSTRY_OPTIONS, businessOnboardingSchema } from '@nnoo/validation';
import { useBusiness } from '../../contexts/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { AuthVideoBackground } from '../../components/AuthVideoBackground';

export default function OnboardingScreen() {
  const router = useRouter();
  const { refreshMemberships } = useBusiness();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    industry: '',
    phone: '',
    email: '',
  });

  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => {
      Keyboard.dismiss();
    };
  }, []);

  const handleSubmit = async () => {
    Keyboard.dismiss();

    const validation = businessOnboardingSchema.safeParse({
      name: form.name.trim(),
      industry: form.industry,
      country_code: 'NG',
      phone: form.phone.trim() || '',
      email: form.email.trim() || '',
    });

    if (!validation.success) {
      Alert.alert('Validation Error', validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('create_business_with_owner', {
        name: validation.data.name,
        industry: validation.data.industry,
        country_code: validation.data.country_code,
        phone: validation.data.phone || null,
        email: validation.data.email || null,
      });

      if (error) {
        throw error;
      }

      await refreshMemberships();
      router.replace('/(app)/');
    } catch (err: any) {
      Alert.alert('Setup Failed', err.message || 'An error occurred while creating your business.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Keyboard.dismiss();
    signOut();
  };

  return (
    <AuthVideoBackground videoSource={require('../../assets/videos/vid1.mp4')}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={true}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.innerWrapper}>
                <View style={styles.topBar}>
                  <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                    <Ionicons name="log-out-outline" color="#FFF" size={20} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                  </TouchableOpacity>
                </View>

              <View style={styles.sheetContainer}>
                <View style={styles.header}>
                  <Text style={styles.title}>Set up your business</Text>
                  <Text style={styles.subtitle}>
                    Create your business workspace to start managing your operations on NNOO.
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Business Name *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="briefcase-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Acme Trading Co."
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        value={form.name}
                        onChangeText={(text) => setForm({ ...form, name: text })}
                        editable={!loading}
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => phoneRef.current?.focus()}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Industry *</Text>
                    <View style={styles.pickerContainer}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                        {INDUSTRY_OPTIONS.map((ind) => (
                          <TouchableOpacity
                            key={ind}
                            style={[
                              styles.chip,
                              form.industry === ind && styles.chipSelected
                            ]}
                            onPress={() => {
                              Keyboard.dismiss();
                              setForm({ ...form, industry: ind });
                            }}
                          >
                            <Text style={[
                              styles.chipText,
                              form.industry === ind && styles.chipTextSelected
                            ]}>{ind}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Business Phone (Optional)</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="call-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                      <TextInput
                        ref={phoneRef}
                        style={styles.input}
                        placeholder="+234..."
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        keyboardType="phone-pad"
                        value={form.phone}
                        onChangeText={(text) => setForm({ ...form, phone: text })}
                        editable={!loading}
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => emailRef.current?.focus()}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Business Email (Optional)</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                      <TextInput
                        ref={emailRef}
                        style={styles.input}
                        placeholder="hello@acme.com"
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={form.email}
                        onChangeText={(text) => setForm({ ...form, email: text })}
                        editable={!loading}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                      />
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.button, loading && styles.buttonDisabled]} 
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Setting up...' : 'Create Business'}
                    </Text>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  innerWrapper: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  signOutText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sheetContainer: {
    backgroundColor: '#0A1C16',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    padding: 32,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    color: '#FFF',
    fontSize: 16,
  },
  pickerContainer: {
    marginTop: 4,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 12,
  },
  chipSelected: {
    backgroundColor: 'rgba(184, 242, 92, 0.1)',
    borderColor: '#B8F25C',
  },
  chipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#B8F25C',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#B8F25C',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#B8F25C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#0A1C16',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
