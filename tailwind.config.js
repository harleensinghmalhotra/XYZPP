/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // CMYK process colors — the brand IS the print process
        cyan: '#00AEEF',
        magenta: '#EC008C',
        yellow: '#FFC800',
        // Warm ink (key) + warm paper ramp — never pure #000/#fff
        ink: {
          DEFAULT: '#16130F',
          900: '#16130F',
          800: '#211D17',
          700: '#2E2820',
          600: '#463E32',
          500: '#5C5346',
          400: '#7A7061',
        },
        paper: {
          DEFAULT: '#F3EDE1',
          raised: '#EDE6D7',
          sunk: '#E7DFCD',
          deep: '#DED4BE',
        },
        // Sampled hero-video average tone — melt sections into the video
        tone: 'var(--video-tone)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Libre Bodoni"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
        // Reference hero typeface
        metrisch: ['"Metrisch"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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
