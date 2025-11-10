/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Path to Tremor's node_modules directory
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light Theme - Re-architected for better visual hierarchy
        background: '#BFF4FF',           // Use "very light" blue as the main background
        foreground: '#0E5463',           // Use "very dark" for text
        card: '#FFFAFA',                 // Use off-white for card surfaces to make them stand out
        'card-foreground': '#0E5463',
        primary: '#14B4D6',              // Use "medium dark" for interactive elements
        'primary-foreground': '#FFFAFA',
        border: '#BFF4FF',               // Border color can match the background for a "borderless" look on cards
        'muted-background': '#E6F9FF',   // A slightly different shade for hovers on cards
        'muted-foreground': 'rgba(14, 84, 99, 0.6)',

        // Dark Theme
        'dark-background': '#0E5463',
        'dark-foreground': '#BFF4FF',
        'dark-card': '#115E6E',
        'dark-card-foreground': '#BFF4FF',
        'dark-primary': '#14B4D6',
        'dark-primary-foreground': '#0E5463',
        'dark-border': '#14B4D6',
        'dark-muted-background': 'rgba(20, 180, 214, 0.15)',
        'dark-muted-foreground': 'rgba(191, 244, 255, 0.6)',
      }
    },
  },
  plugins: [],
}