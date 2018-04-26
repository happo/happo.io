module.exports = {
  logLevel: 'debug',
  environments: ['node'],
  excludes: [
    './build/**',
  ],
  aliases: {
    'request': 'request-promise-native',
  },
  declarationKeyword: 'import',
  importDevDependencies: true,
  globals: ['jest'],
};
