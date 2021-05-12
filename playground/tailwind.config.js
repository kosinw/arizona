// tailwind.config.js
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        gray: {
          900: "#18181B",
        },
        primary: {
          500: "#27B692"
        }
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
