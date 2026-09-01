tailwind.config = {
  safelist: [
    'bg-white/50',
    'bg-white/60',
    'bg-white/70',
    'hover:bg-white/70',
    'hover:border-slate-900/20',
    'backdrop-blur-md',
    'rounded-2xl',
    'rounded-full',
    'border-slate-900/10',
    'text-slate-700',
    'hover:bg-white'
  ],

  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f8f8f7',
          100: '#efefec',
          200: '#dcdcd7',
          300: '#c3c3bc',
          400: '#9b9b94',
          500: '#6b6b66',
          600: '#54544f',
          700: '#40403c',
          800: '#2e2e2b',
          900: '#1f1f1d'
        },
        surface: {
          900: '#ece9e1',
          800: '#e4e0d8',
          700: '#d7d2c9'
        },
        mist: {
          100: '#ececec',
          200: '#d1d5db',
          400: '#6b7280'
        },
        consult: {
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a'
        }
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
        serif: ['Noto Serif KR', 'serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  }
};
