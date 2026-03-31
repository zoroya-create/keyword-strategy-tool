import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Noto Sans JP'", "sans-serif"],
      },
      colors: {
        zoroya: {
          purple: "#5C35D9",
          "purple-dark": "#3D1FA3",
          teal: "#00B4B4",
          navy: "#14487E",
        },
      },
    },
  },
  plugins: [],
};

export default config;
