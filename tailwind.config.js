/** @type {import('tailwindcss').Config} */
// Colors below are kept in sync manually with src/lib/theme.ts (the TS token
// module used for inline `style`/lucide `color` props). Update both together.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        carbon: "#0F172A",
        brand: {
          DEFAULT: "#0066FF",
          light: "#4DA3FF",
          50: "#EBF3FF",
          100: "#CCE0FF",
        },
        ink: {
          DEFAULT: "#1F2937",
          soft: "#374151",
          muted: "#64748B",
          subtle: "#94A3B8",
        },
        line: {
          DEFAULT: "#E2E8F0",
          soft: "#F1F5F9",
        },
        canvas: "#F5F7FB",
        success: {
          DEFAULT: "#16A34A",
          50: "#DCFCE7",
        },
        warning: {
          DEFAULT: "#F59E0B",
          50: "#FEF3C7",
        },
        danger: {
          DEFAULT: "#DC2626",
          50: "#FEE2E2",
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        display: ['"Montserrat Variable"', "Montserrat", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #0066FF, #4DA3FF)",
      },
    },
  },
  plugins: [],
};
