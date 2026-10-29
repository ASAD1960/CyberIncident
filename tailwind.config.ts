import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--paper-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        muted: 'rgb(var(--muted-rgb) / <alpha-value>)',
        line: 'rgb(var(--line-rgb) / <alpha-value>)',
        brand: { DEFAULT: 'rgb(var(--brand-rgb) / <alpha-value>)', dark: 'rgb(var(--brand-dark-rgb) / <alpha-value>)', soft: 'rgb(var(--brand-soft-rgb) / <alpha-value>)' },
        rail: 'rgb(var(--rail-rgb) / <alpha-value>)',
        danger: { DEFAULT: 'rgb(var(--danger-rgb) / <alpha-value>)', soft: 'rgb(var(--danger-soft-rgb) / <alpha-value>)' },
        ok: { DEFAULT: 'rgb(var(--ok-rgb) / <alpha-value>)', soft: 'rgb(var(--ok-soft-rgb) / <alpha-value>)' },
        warn: { DEFAULT: 'rgb(var(--warn-rgb) / <alpha-value>)', soft: 'rgb(var(--warn-soft-rgb) / <alpha-value>)' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
