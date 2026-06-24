import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // BIGLIGHT admin palette: white / navy / light blue
        navy: {
          DEFAULT: "#13335C",
          900: "#0F2A4A",
          700: "#1B4A86",
        },
        brand: {
          blue: "#2563EB",
          light: "#E8F0FE",
        },
        ink: "#16181D",
      },
    },
  },
  plugins: [],
};

export default config;
