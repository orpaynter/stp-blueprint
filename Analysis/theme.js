import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1E40AF', // Deep Blue
    accent: '#F59E0B', // Bright Amber
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#1F2937', // Cool Gray
    error: '#DC2626',
    success: '#10B981',
    warning: '#FBBF24',
    info: '#3B82F6',
    disabled: '#9CA3AF',
    placeholder: '#6B7280',
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'Inter-Regular',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'Inter-Light',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'Inter-Thin',
      fontWeight: '100',
    },
  },
  roundness: 8,
  animation: {
    scale: 1.0,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  subtitle1: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  subtitle2: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  body1: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    fontWeight: 'normal',
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    fontWeight: 'normal',
  },
  button: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter-Regular',
    fontWeight: 'normal',
  },
  overline: {
    fontSize: 10,
    lineHeight: 16,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
};
