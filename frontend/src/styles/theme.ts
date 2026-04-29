// src/styles/theme.ts

export const colors = {
  // Primary
  primary: {
    main: '#4099FD',
    hover: '#3B82F6',
    light: '#EFF6FF',
    dark: '#2563EB',
  },
  
  // Grayscale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#374151',
    700: '#1F2937',
    800: '#111827',
  },
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#3B82F6',
  
  // Category Colors
  category: {
    real_estate: '#5B8DEE',
    employment: '#D946A6',
    freelance: '#8B5CF6',
    other: '#6B7280',
  },
  
  // Background
  background: {
    default: '#FFFFFF',
    paper: '#FAFBFC',
    gray: '#F9FAFB',
  },
};

export const typography = {
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '15px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '28px',
    '5xl': '32px',
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
  '5xl': '48px',
};

export const borderRadius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
  md: '0 4px 12px rgba(0, 0, 0, 0.1)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.15)',
  xl: '0 12px 32px rgba(0, 0, 0, 0.2)',
};

export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

//buttonSizes
export const buttonSizes = {
  small: {
    padding: '6px 12px',
    fontSize: '13px',
    height: '32px',
    iconSize: '16px',
  },
  medium: {
    padding: '10px 20px',
    fontSize: '14px',
    height: '38px',
    iconSize: '18px',
  },
  large: {
    padding: '12px 24px',
    fontSize: '15px',
    height: '44px',
    iconSize: '20px',
  },
};

// inputSizes 
export const inputSizes = {
  small: {
    padding: '6px 12px',
    fontSize: '13px',
    height: '32px',
  },
  medium: {
    padding: '8px 16px',
    fontSize: '14px',
    height: '38px',
  },
  large: {
    padding: '10px 20px',
    fontSize: '15px',
    height: '44px',
  },
};

// 편의 함수
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
};

// 애니메이션 속도
export const transitions = {
  fast: '0.15s',
  normal: '0.2s',
  slow: '0.3s',
  easings: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },
};

export default theme;