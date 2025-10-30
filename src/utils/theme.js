// src/utils/theme.js
export const lightTheme = {
  mode: 'light',
  dark: false,
  colors: {
    primary: '#4A90E2',
    secondary: '#7B68EE',
    success: '#10B981',      // ← NOVA: Para botão "Tomar"
    danger: '#EF4444',
    warning: '#F59E0B',
    background: '#F5F7FA',
    cardBackground: '#FFFFFF',
    text: '#1F2937',
    subText: '#6B7280',
    border: '#E5E7EB',
    inputBackground: '#F9FAFB',
    placeholder: '#9CA3AF',
  },
};

export const darkTheme = {
  mode: 'dark',
  dark: true,
  colors: {
    primary: '#60A5FA',
    secondary: '#A78BFA',
    success: '#34D399',      // ← NOVA: Para botão "Tomar"
    danger: '#F87171',
    warning: '#FBBF24',
    background: '#111827',
    cardBackground: '#1F2937',
    text: '#F9FAFB',
    subText: '#D1D5DB',
    border: '#374151',
    inputBackground: '#374151',
    placeholder: '#9CA3AF',
  },
};