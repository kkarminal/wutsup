import { useThemeContext } from '../contexts/ThemeContext';

/**
 * Returns the active theme token set.
 * Respects the user's in-app preference (system / light / dark).
 *
 * Usage:
 *   const theme = useTheme();
 *   <View style={{ backgroundColor: theme.background }} />
 */
export function useTheme() {
  return useThemeContext().tokens;
}
