import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useGameStore } from '../src/stores/useGameStore';

export default function RootLayout() {
  const connectSocket = useGameStore(state => state.connectSocket);

  useEffect(() => {
    // Conectar automáticamente al servidor Socket.IO al arrancar la app
    connectSocket();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#101014' }
        }}
      />
    </>
  );
}
