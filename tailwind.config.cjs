module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      colors: {
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344'
        },
        // Refined automotive console palette. Slightly warmer "card" surface,
        // deeper "deep" base and a hairline border that reads like brushed metal.
        darkBg: {
          deep: '#0a0f14',
          card: '#101820',
          border: '#1f2a33',
          hover: '#172430'
        },
        accent: {
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e',
          violet: '#a78bfa'
        }
      },
      boxShadow: {
        'brand-glow': '0 18px 48px -18px rgba(6, 182, 212, 0.55)',
        'card-soft': '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 18px 36px -22px rgba(0,0,0,0.65)',
        'inset-hairline': 'inset 0 1px 0 rgba(255,255,255,0.04)'
      },
      backgroundImage: {
        'grid-faint': "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        'sheen': 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0) 40%)'
      },
      backgroundSize: {
        'grid-32': '32px 32px'
      }
    }
  }
};
