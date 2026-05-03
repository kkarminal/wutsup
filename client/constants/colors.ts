/**
 * Wutsup color palette — derived from the brand logo.
 *
 * The logo uses a vibrant rainbow palette (red, green, blue, yellow, cyan,
 * magenta) on a white background with black text. The theme tokens below
 * are built from those hues, tuned for readability and accessibility.
 */

// ---------------------------------------------------------------------------
// Brand palette (raw hues from the logo)
// ---------------------------------------------------------------------------
export const BRAND = {
  blue:    '#0055FF',  // logo blue,   used as primary action color
  green:   '#00CC44',  // logo green,  used as success / accent
  red:     '#FF2222',  // logo red,    used for errors / destructive
  yellow:  '#FFD700',  // logo yellow, used for warnings / highlights
  cyan:    '#00CCDD',  // logo cyan,   used for info / secondary accent
  magenta: '#CC00CC',  // logo magenta, used sparingly for special states
  black:   '#0A0A0A',
  white:   '#FFFFFF',
} as const;

// ---------------------------------------------------------------------------
// Light theme
// ---------------------------------------------------------------------------
export const LIGHT = {
  // Backgrounds
  background:        '#FFFFFF',
  backgroundSubtle:  '#F5F6FA',
  surface:           '#FFFFFF',
  surfaceRaised:     '#F0F1F7',

  // Text
  textPrimary:       '#0A0A0A',
  textSecondary:     '#4A4A5A',
  textDisabled:      '#9A9AAA',
  textInverse:       '#FFFFFF',

  // Brand / interactive
  primary:           BRAND.blue,
  primaryPressed:    '#0044CC',
  primarySubtle:     '#E6EEFF',

  accent:            BRAND.green,
  accentPressed:     '#00AA38',
  accentSubtle:      '#E6FAF0',

  // Semantic
  success:           BRAND.green,
  successSubtle:     '#E6FAF0',
  warning:           BRAND.yellow,
  warningSubtle:     '#FFF9E0',
  error:             BRAND.red,
  errorSubtle:       '#FFE8E8',
  info:              BRAND.cyan,
  infoSubtle:        '#E0F9FB',

  // Borders & dividers
  border:            '#DDDDE8',
  borderStrong:      '#AAAABB',

  // Misc
  shadow:            'rgba(10, 10, 10, 0.10)',
  overlay:           'rgba(10, 10, 10, 0.40)',
  statusBar:         'dark' as const,
} as const;

// ---------------------------------------------------------------------------
// Dark theme
// ---------------------------------------------------------------------------
export const DARK = {
  // Backgrounds
  background:        '#0D0D14',
  backgroundSubtle:  '#16161F',
  surface:           '#1C1C28',
  surfaceRaised:     '#252535',

  // Text
  textPrimary:       '#F0F0FF',
  textSecondary:     '#9090AA',
  textDisabled:      '#505060',
  textInverse:       '#0A0A0A',

  // Brand / interactive
  primary:           '#4488FF',  // slightly lighter for dark bg contrast
  primaryPressed:    '#6699FF',
  primarySubtle:     '#0D1A33',

  accent:            '#22EE66',  // brighter green for dark bg
  accentPressed:     '#44FF88',
  accentSubtle:      '#0D2619',

  // Semantic
  success:           '#22EE66',
  successSubtle:     '#0D2619',
  warning:           '#FFE033',
  warningSubtle:     '#2A2200',
  error:             '#FF5555',
  errorSubtle:       '#2A0D0D',
  info:              '#22DDEE',
  infoSubtle:        '#0D2226',

  // Borders & dividers
  border:            '#2A2A3A',
  borderStrong:      '#44445A',

  // Misc
  shadow:            'rgba(0, 0, 0, 0.40)',
  overlay:           'rgba(0, 0, 0, 0.60)',
  statusBar:         'light' as const,
} as const;

// ---------------------------------------------------------------------------
// Shared spacing, typography, and radius tokens
// ---------------------------------------------------------------------------
export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm:   4,
  md:   8,
  lg:   16,
  full: 9999,
} as const;

export const FONT_SIZE = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  xxxl: 32,
} as const;

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,
} as const;
