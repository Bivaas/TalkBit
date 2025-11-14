// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}", // depending on your setup
  ],
  theme: {
    extend: {},
  },
  safelist: [
    {
      pattern: /(bg|text|border)-(blue|green|yellow|purple|red|gray)-(100|300|500|700)/,
      variants: ['hover'],
    },
  ],
  plugins: [],
}
