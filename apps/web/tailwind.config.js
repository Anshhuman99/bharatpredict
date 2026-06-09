/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        card: {
          DEFAULT: "rgb(var(--card))",
          hover: "rgb(var(--card-hover))",
        },
        border: {
          DEFAULT: "rgb(var(--border))",
          accent: "rgb(var(--border-accent))",
        },
        brand: {
          yes: "#00c853",    // Vibrant emerald for YES
          no: "#ff3d00",     // Bright coral-red for NO
          yesMuted: "rgba(0, 200, 83, 0.15)",
          noMuted: "rgba(255, 61, 0, 0.15)",
          accent: "#3b82f6", // Fintech highlight blue
        },
        muted: {
          DEFAULT: "rgb(var(--muted))",
          foreground: "rgb(var(--muted-foreground))",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        heading: ["Outfit", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.15)",
        yesGlow: "0 0 20px rgba(0, 200, 83, 0.25)",
        noGlow: "0 0 20px rgba(255, 61, 0, 0.25)",
      }
    },
  },
  plugins: [],
};
