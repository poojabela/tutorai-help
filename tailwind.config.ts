import type { Config } from "tailwindcss";

import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [`"Work Sans"`, ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
  future: {
    hoverOnlyWhenSupported: true,
  },
} satisfies Config;
