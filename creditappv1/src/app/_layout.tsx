import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CreditsProvider } from '@/src/context/CreditsContext';
import { requestPermissions } from '@/src/services/notifications';

export default function RootLayout() {
  useEffect(() => {
    requestPermissions();
  }, []);

  return (
    <CreditsProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="pin" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </CreditsProvider>
  );
}
