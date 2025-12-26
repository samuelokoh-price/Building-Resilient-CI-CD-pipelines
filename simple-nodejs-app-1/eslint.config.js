const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        // Node.js globals
        require: "readonly",
        module: "readonly",
        console: "readonly",
        // Jest globals
        test: "readonly",
        expect: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn"
    }
  }
];
