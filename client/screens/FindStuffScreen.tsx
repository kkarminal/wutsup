import { StyleSheet, Text, View } from 'react-native';

import { FIND_STUFF_FONT_SIZE, FIND_STUFF_LABEL } from './FindStuffScreen.constants';

export { FIND_STUFF_FONT_SIZE, FIND_STUFF_LABEL } from './FindStuffScreen.constants';

export function FindStuffScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{FIND_STUFF_LABEL}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FIND_STUFF_FONT_SIZE,
  },
});
