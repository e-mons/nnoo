import React, { useState, useRef, useImperativeHandle } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
  iconName?: keyof typeof Feather.glyphMap;
}

export const Input = React.forwardRef<TextInput, InputProps>(function Input(
  { label, error, isPassword, iconName, style, onFocus, onBlur, ...props },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const localInputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => localInputRef.current as TextInput);

  const handleContainerPress = () => {
    localInputRef.current?.focus();
  };

  const handleFocus: TextInputProps['onFocus'] = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps['onBlur'] = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text>
      
      <Pressable
        onPress={handleContainerPress}
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
          style,
        ]}
      >
        {iconName && (
          <View style={styles.iconContainer}>
            <Feather 
              name={iconName} 
              size={18} 
              color={isFocused ? '#0A1C16' : 'rgba(10, 28, 22, 0.4)'} 
            />
          </View>
        )}

        <TextInput
          ref={localInputRef}
          style={[styles.input, !iconName && { paddingLeft: 20 }]}
          placeholderTextColor="rgba(10, 28, 22, 0.3)"
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Feather 
              name={showPassword ? 'eye-off' : 'eye'} 
              size={18} 
              color="rgba(10, 28, 22, 0.5)" 
            />
          </TouchableOpacity>
        )}
      </Pressable>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#143628',
    marginBottom: 8,
    marginLeft: 4,
  },
  labelFocused: {
    color: '#0A1C16',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(10, 28, 22, 0.1)',
    borderRadius: 24, // Pill shape inside the card
    height: 56,
  },
  inputFocused: {
    borderColor: '#B8F25C',
    backgroundColor: '#FFFFFF',
    shadowColor: '#B8F25C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputError: {
    borderColor: '#FF4D4D',
    backgroundColor: '#FFF5F5',
  },
  iconContainer: {
    paddingLeft: 20,
    paddingRight: 12,
    height: '100%',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#0A1C16',
    fontSize: 16,
    fontWeight: '500',
    paddingRight: 16,
  },
  eyeButton: {
    paddingHorizontal: 20,
    height: '100%',
    justifyContent: 'center',
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 12,
    fontWeight: '500',
  },
});
