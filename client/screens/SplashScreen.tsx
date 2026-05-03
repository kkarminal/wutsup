import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';

export function SplashScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image
        source={require('../assets/wutsup-logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Wutsup"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 240,
    height: 120,
  },
});
