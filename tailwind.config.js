/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        text: 'var(--color-text)',
        card: 'var(--color-card)',
        border: 'var(--color-border)',
      },
      /* Responsive breakpoints: mobile-first min-width */
      screens: {
        xs: '481px',   /* Mobile landscape / small tablets */
        sm: '769px',   /* Tablets (portrait) */
        md: '1025px',  /* Laptops and desktops */
        lg: '1441px',  /* Large desktops */
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
}