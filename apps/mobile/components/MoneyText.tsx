import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface MoneyTextProps extends TextProps {
  amountMinor: string | number;
  currencyCode?: string;
  style?: TextProps['style'];
}

export function MoneyText({ 
  amountMinor, 
  currencyCode = 'NGN', 
  style, 
  numberOfLines = 1,
  adjustsFontSizeToFit = true,
  ...props 
}: MoneyTextProps) {
  const minorVal = typeof amountMinor === 'string' ? parseInt(amountMinor, 10) : amountMinor;
  
  if (isNaN(minorVal)) {
    return <Text style={[styles.text, style]} numberOfLines={numberOfLines} {...props}>-</Text>;
  }

  const formatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currencyCode,
  }).format(minorVal / 100);

  return (
    <Text 
      style={[styles.text, style]} 
      numberOfLines={numberOfLines} 
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      {...props}
    >
      {formatted}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: '#FFFFFF',
  },
});
