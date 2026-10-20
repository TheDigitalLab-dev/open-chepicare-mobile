/* Design tokens convertidos de docs/mobile-design-tokens.css */

const colors = {
  light: {
    background: 'hsl(43, 44%, 97%)',
    foreground: 'hsl(210, 24%, 16%)',

    card: 'hsl(0, 0%, 100%)',
    cardForeground: 'hsl(210, 24%, 16%)',

    popover: 'hsl(0, 0%, 100%)',
    popoverForeground: 'hsl(210, 24%, 16%)',

    primary: 'hsl(174, 55%, 47%)',
    primaryForeground: 'hsl(0, 0%, 100%)',

    secondary: 'hsl(174, 20%, 95%)',
    secondaryForeground: 'hsl(174, 55%, 25%)',

    muted: 'hsl(42, 25%, 92%)',
    mutedForeground: 'hsl(215, 16%, 47%)',

    accent: 'hsl(174, 35%, 85%)',
    accentForeground: 'hsl(174, 55%, 25%)',

    destructive: 'hsl(0, 84%, 60%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',

    success: 'hsl(142, 76%, 36%)',
    successForeground: 'hsl(0, 0%, 98%)',

    warning: 'hsl(38, 92%, 50%)',
    warningForeground: 'hsl(0, 0%, 98%)',

    info: 'hsl(199, 89%, 48%)',
    infoForeground: 'hsl(0, 0%, 98%)',

    border: 'hsl(174, 20%, 88%)',
    input: 'hsl(174, 20%, 88%)',
    ring: 'hsl(174, 55%, 47%)',

    chart1: 'hsl(174, 55%, 47%)',
    chart2: 'hsl(142, 76%, 36%)',
    chart3: 'hsl(38, 92%, 50%)',
    chart4: 'hsl(199, 89%, 48%)',
    chart5: 'hsl(0, 84%, 60%)',

    // Tipos del calendario (mismos tonos que `--event-*` de la web).
    eventAppointment: 'hsl(217, 85%, 50%)',
    eventPrescription: 'hsl(271, 65%, 52%)',
    eventVaccination: 'hsl(152, 70%, 33%)',
    eventDeworming: 'hsl(28, 90%, 45%)',
    eventClinic: 'hsl(330, 75%, 47%)',
  },

  dark: {
    background: 'hsl(222, 84%, 5%)',
    foreground: 'hsl(210, 40%, 98%)',

    card: 'hsl(222, 84%, 5%)',
    cardForeground: 'hsl(210, 40%, 98%)',

    popover: 'hsl(222, 84%, 5%)',
    popoverForeground: 'hsl(210, 40%, 98%)',

    primary: 'hsl(174, 55%, 57%)',
    primaryForeground: 'hsl(222, 47%, 11%)',

    secondary: 'hsl(217, 33%, 18%)',
    secondaryForeground: 'hsl(210, 40%, 98%)',

    muted: 'hsl(217, 33%, 18%)',
    mutedForeground: 'hsl(215, 20%, 65%)',

    accent: 'hsl(217, 33%, 18%)',
    accentForeground: 'hsl(210, 40%, 98%)',

    destructive: 'hsl(0, 63%, 31%)',
    destructiveForeground: 'hsl(210, 40%, 98%)',

    success: 'hsl(142, 70%, 45%)',
    successForeground: 'hsl(210, 40%, 98%)',

    warning: 'hsl(38, 90%, 55%)',
    warningForeground: 'hsl(210, 40%, 98%)',

    info: 'hsl(199, 85%, 55%)',
    infoForeground: 'hsl(210, 40%, 98%)',

    border: 'hsl(217, 33%, 18%)',
    input: 'hsl(217, 33%, 18%)',
    ring: 'hsl(213, 27%, 84%)',

    chart1: 'hsl(174, 55%, 57%)',
    chart2: 'hsl(142, 70%, 45%)',
    chart3: 'hsl(38, 90%, 55%)',
    chart4: 'hsl(199, 85%, 55%)',
    chart5: 'hsl(0, 63%, 50%)',

    eventAppointment: 'hsl(213, 90%, 66%)',
    eventPrescription: 'hsl(270, 80%, 74%)',
    eventVaccination: 'hsl(150, 60%, 52%)',
    eventDeworming: 'hsl(32, 92%, 60%)',
    eventClinic: 'hsl(330, 85%, 70%)',
  },
} as const;

const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
} as const;

const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

const shadows = {
  light: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 7.5,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.1,
      shadowRadius: 12.5,
      elevation: 10,
    },
  },
  dark: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 1,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 3,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 7.5,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.5,
      shadowRadius: 12.5,
      elevation: 10,
    },
  },
} as const;

const layout = {
  containerPadding: 16,
  headerHeight: 56,
  bottomNavHeight: 64,
  minTouchTarget: 44,
} as const;

const animation = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

export type ColorScheme = 'light' | 'dark';
/** Nombres de color semánticos (mismos en light/dark). Valores como string. */
export type Colors = Record<keyof typeof colors.light, string>;

export const tokens = {
  colors,
  radius,
  fontSize,
  lineHeight,
  fontWeight,
  spacing,
  shadows,
  layout,
  animation,
} as const;
