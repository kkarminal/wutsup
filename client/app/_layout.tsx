import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '../contexts/ThemeContext';
import { useTheme } from '../hooks/useTheme';

// Inner component so useTheme can read from ThemeProvider
function AppStack() {
  const theme = useTheme();

  return (
    <>
      <Stack>
        <Stack.Screen name="index"     options={{ headerShown: false }} />
        <Stack.Screen name="home"      options={{ headerShown: false }} />
        <Stack.Screen name="settings"  options={{ headerShown: false }} />
        <Stack.Screen name="find-food" options={{ headerShown: false }} />
        <Stack.Screen name="find-stuff" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={theme.statusBar} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
