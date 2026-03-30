/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#D4A843",
          light: "#F2C96B",
          dim: "#8A6E2A"
        },
        dark: {
          base: "#0A0C10",
          surface: "#111318",
          card: "#181C24",
          elevated: "#1F2430",
          input: "#151920"
        },
        teal: {
          DEFAULT: "#1ECFB0",
          dim: "#0E7A68"
        }
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(212, 168, 67, 0.15), 0 18px 55px rgba(0, 0, 0, 0.35)"
      },
      backgroundImage: {
        "mesh-dark": "radial-gradient(circle at top, rgba(30,207,176,0.12), transparent 35%), radial-gradient(circle at 80% 20%, rgba(212,168,67,0.12), transparent 25%), linear-gradient(180deg, #0A0C10 0%, #111318 50%, #0A0C10 100%)"
      }
    }
  },
  plugins: []
};

