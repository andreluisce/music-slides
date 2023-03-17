module.exports = {
  globals: { module: false, inject: false, document: false },
  env: {
    browser: true,
    es2021: true,
    'jest/globals': true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:json/recommended',
    'prettier',
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
  },
};
