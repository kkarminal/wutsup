import { StyleSheet, Text, View } from 'react-native';

import { FIND_FOOD_FONT_SIZE, FIND_FOOD_LABEL } from './FindFoodScreen.constants';

export { FIND_FOOD_FONT_SIZE, FIND_FOOD_LABEL } from './FindFoodScreen.constants';

export function FindFoodScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{FIND_FOOD_LABEL}</Text>
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
    fontSize: FIND_FOOD_FONT_SIZE,
  },
});
