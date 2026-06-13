/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f7fe',
          100: '#e1e9fc',
          200: '#c7d7f9',
          500: '#4318ffd8', // Premium Electric Indigo
          600: '#3311db',
          700: '#1b0ea4',
        },
        medical: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
        },
        alert: {
          high: '#ef4444',
          low: '#3b82f6',
          critical: '#7c3aed',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
