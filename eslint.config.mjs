import globals from 'globals';
import js from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import pluginJest from 'eslint-plugin-jest';
import configPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['build/**', 'coverage/**', 'test/integrations/examples/*-error-*'],
  },

  js.configs.recommended,
  pluginReact.configs.flat.recommended,
  configPrettier,

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      'react/display-name': 'off',
      'react/prop-types': 'off',
    },
  },

  {
    files: ['test/**/*.js', '**/__tests__/*.test.js'],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: pluginJest.environments.globals.globals,
    },
  },
];
