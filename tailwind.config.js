/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── EKTA PALETTE (design law) ──
        navy: { DEFAULT: '#0F2444', 2: '#1B3A6B', deep: '#0A1B33' },
        gold: { DEFAULT: '#9B7420', 2: '#C89A3C', text: '#836013' },
        olive: { DEFAULT: '#6B7A2A', light: '#8FA05A', deep: '#5A6623' },
        cream: { DEFAULT: '#FDFAF4', 2: '#F0EBE0', 3: '#F5F0E8' },
        ink: {
          DEFAULT: '#1C2019',
          // warm-grey text ramp retained for footer meta (≈ her #444/#555 greys)
          600: '#463E32',
          500: '#5C5346',
          400: '#7A7061',
        },
        // ── Legacy class aliases — old System-A utility names now resolve to
        //    Ekta's palette so existing className hexes reskin without edits. ──
        cyan: '#1B3A6B',
        magenta: '#9B7420',
        yellow: '#C89A3C',
        paper: {
          DEFAULT: '#FDFAF4',
          raised: '#F0EBE0',
          sunk: '#F0EBE0',
          deep: '#E5E2DA',
        },
        tone: 'var(--video-tone)',
      },
      fontFamily: {
        // Ekta's stack everywhere — display + legacy 'metrisch' alias → Inter Tight.
        display: ['"Inter Tight"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        tight: ['"Inter Tight"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Inter Tight"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
        metrisch: ['"Inter Tight"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.9rem, 11.5vw, 11rem)', { lineHeight: '0.86', letterSpacing: '-0.02em' }],
        'display-l': ['clamp(2.5rem, 8vw, 7rem)', { lineHeight: '0.9', letterSpacing: '-0.015em' }],
        'display-m': ['clamp(2rem, 5vw, 4.5rem)', { lineHeight: '0.95', letterSpacing: '-0.01em' }],
      },
      letterSpacing: {
        label: '0.28em',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      maxWidth: {
        page: '1600px',
      },
    },
  },
  plugins: [],
}
