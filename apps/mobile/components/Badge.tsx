import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  let containerStyle: ViewStyle;
  let textStyle: TextStyle;

  switch (variant) {
    case 'success':
      containerStyle = { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' };
      textStyle = { color: '#10B981' };
      break;
    case 'error':
      containerStyle = { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' };
      textStyle = { color: '#EF4444' };
      break;
    case 'warning':
      containerStyle = { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' };
      textStyle = { color: '#F59E0B' };
      break;
    case 'info':
      containerStyle = { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: '#3B82F6' };
      textStyle = { color: '#3B82F6' };
      break;
    case 'default':
    default:
      containerStyle = { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255,255,255,0.2)' };
      textStyle = { color: '#9CA3AF' };
      break;
  }

  return (
    <View style={[styles.container, containerStyle, style]}>
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
