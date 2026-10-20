/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A8A",      // Deep blue (Section 7.1)
        surface: "#FFFFFF",
        border: "#E2E8F0",
        muted: "#475569",
        danger: "#B91C1C",
        lost: {
          text: "#B45309",
          bg: "#FEF3C7"
        },
        found: {
          text: "#166534",
          bg: "#DCFCE7"
        }
      }
    },
  },
  plugins: [],
}
