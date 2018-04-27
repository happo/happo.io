module.exports = {
  extends: 'airbnb',
  plugins: ['jest'],
  env: {
    'jest/globals': true,
  },

  rules: {
    'function-paren-newline': 0,
    'react/jsx-filename-extension': 0,
    'object-curly-newline': 0,
    'no-multi-assign': 0,
    'no-param-reassign': 0,
    'consistent-return': 0,
    'no-console': 0,
    'arrow-parens': 0,
    'prefer-destructuring': 0,
    'global-require': 0,
    'no-restricted-syntax': 0,
  },

  globals: {
    document: true,
  },
};
