module.exports = {
  env: {
    es6: true,
    node: true,
    mocha: true
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    strict: 1,
    "no-var": 1,
    "prefer-const": 1,
    "prefer-arrow-callback": 1,
    "prefer-destructuring": 1,
    "arrow-body-style": 1,
    "no-console": 0,
    indent: ["error", 2],
    "linebreak-style": ["error", "windows"],
    quotes: ["error", "double"],
    semi: ["error", "always"]
  }
};
