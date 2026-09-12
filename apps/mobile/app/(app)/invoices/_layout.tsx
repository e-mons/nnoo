import { Stack } from 'expo-router';

export default function InvoicesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
      />
      <Stack.Screen
        name="new"
      />
      <Stack.Screen
        name="[id]"
      />
      <Stack.Screen
        name="receipts/index"
      />
      <Stack.Screen
        name="receipts/[id]"
      />
    </Stack>
  );
}
