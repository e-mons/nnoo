import { Stack } from 'expo-router';

export default function IntelligenceLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0A1C16' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0A1C16' },
      }}
    />
  );
}
