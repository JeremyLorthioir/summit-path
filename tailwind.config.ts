import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#003426',
        'on-primary': '#ffffff',
        'primary-container': '#0f4c3a',
        'on-primary-container': '#82bba4',
        'secondary': '#4e5e81',
        'on-secondary': '#ffffff',
        'secondary-container': '#c4d4fd',
        'error': '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'background': '#f8f9ff',
        'on-background': '#0b1c30',
        'surface': '#f8f9ff',
        'on-surface': '#0b1c30',
        'surface-variant': '#d3e4fe',
        'on-surface-variant': '#404944',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display-metrics': ['48px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'headline-lg': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-md': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-caps': ['12px', { lineHeight: '1', fontWeight: '700', letterSpacing: '0.05em' }],
      },
      spacing: {
        'gutter': '16px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '24px',
        'touch-target-min': '48px',
      },
      borderRadius: {
        'DEFAULT': '0.125rem',
        'sm': '0.125rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        'full': '9999px',
      },
    },
  },
  plugins: [],
}
export default config
