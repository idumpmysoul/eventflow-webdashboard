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
        // Light Theme
        background: '#FFFAFA',
        foreground: '#0E5463',
        card: '#FFFFFF',
        'card-foreground': '#0E5463',
        primary: '#14B4D6',
        'primary-foreground': '#FFFAFA',
        border: '#BFF4FF',
        'muted-background': '#BFF4FF',
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