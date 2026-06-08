/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0e14", // Bloomberg/Zerodha deep slate-black
        foreground: "#f5f6f9",
        card: {
          DEFAULT: "#121620", // Card background
          hover: "#181d2a",   // Card hover background
        },
        border: {
          DEFAULT: "#1e2530", // Smooth premium dark borders
          accent: "#2f3a4c",
        },
        brand: {
          yes: "#00c853",    // Vibrant emerald for YES
          no: "#ff3d00",     // Bright coral-red for NO
          yesMuted: "rgba(0, 200, 83, 0.15)",
          noMuted: "rgba(255, 61, 0, 0.15)",
          accent: "#3b82f6", // Fintech highlight blue
        },
        muted: {
          DEFAULT: "#828fbf",
          foreground: "#4b5563",
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
