// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      // Same as the website: plain apostrophes in copy render correctly and read better than escapes.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    ignores: ["dist/*", ".expo/*"],
  },
]);
