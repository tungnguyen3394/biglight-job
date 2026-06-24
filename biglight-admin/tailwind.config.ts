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
        // BIGLIGHT Job — candidate (public) palette: red theme
        bl: {
          red: "#D02E26",
          redd: "#A8231C",
          redsoft: "#FDECEA",
          green: "#1F9D55",
          greensoft: "#E6F6EC",
          amber: "#E8810C",
          ambersoft: "#FFF3E2",
          blue: "#2563EB",
          bluesoft: "#E8F0FE",
          fb: "#1877F2",
          gray: "#5B6472",
          gray2: "#9AA2AE",
          line: "#ECECEF",
          bg: "#F7F8FA",
        },
      },
    },
  },
  plugins: [],
};

export default config;
