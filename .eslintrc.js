module.exports = {
  globals: { module: false, inject: false, document: false },
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:json/recommended',
    'prettier',
    "next"
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'prettier'],
  rules: {
    'no-debugger': 'warn',
    'no-console': 'warn',
    'react/no-unknown-property': ['error', { ignore: ['css', 'sx'] }],
    "react/no-unescaped-entities": "off",
    "@next/next/no-page-custom-font": "off",
    "@next/next/no-html-link-for-pages": ["error", "renderer/pages/"]
  },
};
