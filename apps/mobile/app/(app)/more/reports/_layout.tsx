import { Stack } from 'expo-router';

export default function ReportsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sales" />
      <Stack.Screen name="expenses" />
      <Stack.Screen name="profitability" />
      <Stack.Screen name="receivables" />
      <Stack.Screen name="payables" />
      <Stack.Screen name="inventory" />
    </Stack>
  );
}
