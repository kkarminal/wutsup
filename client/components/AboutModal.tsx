import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { ThemedButton } from './ThemedButton';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../constants/colors';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AboutModal({ visible, onClose }: AboutModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Scrim — tapping outside closes the dialog */}
      <Pressable
        style={[styles.scrim, { backgroundColor: theme.overlay }]}
        onPress={onClose}
        accessibilityLabel="Close about dialog"
      />

      {/* Dialog card */}
      <View style={styles.centeredView} pointerEvents="box-none">
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              shadowColor: theme.shadow,
              borderColor: theme.border,
            },
          ]}
        >
          <Image
            source={require('../assets/wutsup-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Wutsup logo"
          />

          <Text style={[styles.appName, { color: theme.primary }]}>
            wutsup
          </Text>

          <Text style={[styles.version, { color: theme.textSecondary }]}>
            Version 1.0.0
          </Text>

          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Discover food, restaurants, deals, events, and local activities
            happening around you — all in one place.
          </Text>

          <ThemedButton
            label="Close"
            onPress={onClose}
            variant="primary"
            size="md"
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: {
    width: 180,
    height: 90,
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  version: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
});
