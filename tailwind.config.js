// tailwind.config.js
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        'frosted-white': 'rgba(255,255,255,0.12)',
      },
      boxShadow: {
        'minimal': '0 2px 8px 0 rgba(0,0,0,0.10)',
        'frosted': '0 4px 24px 0 rgba(0,0,0,0.12)',
      },
      backdropBlur: {
        'frosted': '16px',
      },
      borderRadius: {
        'card': '1.25rem',
      },
    },
  },
  safelist: [
    {
      pattern: /(bg|text|border)-(blue|green|yellow|purple|red|gray)-(100|300|500|700)/,
      variants: ['hover'],
    },
  ],
  plugins: [],
}
