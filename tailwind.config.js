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
        foreground: '#1A2227',           // Use "very dark" for text
        card: '#FFFAFA',                 // Use off-white for card surfaces to make them stand out
        'card-foreground': '#1A2227',
        primary: '#14B4D6',              // Use "medium dark" for interactive elements
        'primary-foreground': '#FFFAFA',
        border: '#BFF4FF',               // Border color can match the background for a "borderless" look on cards
        'muted-background': '#E6F9FF',   // A slightly different shade for hovers on cards
        'muted-foreground': 'rgba(14, 84, 99, 0.6)',

        // Dark Theme - Refined for better depth and a cleaner look
        'dark-background': '#1A2227',           // Base color: "very dark"
        'dark-foreground': '#BFF4FF',           // High-contrast text: "very light"
        'dark-card': '#106070',                 // A slightly lighter card color for better depth
        'dark-card-foreground': '#BFF4FF',      // Text on cards
        'dark-primary': '#14B4D6',              // Accent color: "medium dark"
        'dark-primary-foreground': '#1A2227',   // Text on primary elements
        'dark-border': '',               // A more subtle border that's a step above the card color
        'dark-muted-background': 'rgba(20, 180, 214, 0.15)', // For hovers
        'dark-muted-foreground': 'rgba(191, 244, 255, 0.6)',   // For subtle text
      }
    },
  },
  plugins: [],
}