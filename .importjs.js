module.exports = {
  logLevel: 'debug',
  environments: ['node'],
  excludes: [
    './build/**',
  ],
  aliases: {
    'fetch': 'node-fetch',
  },
  declarationKeyword: 'import',
  importDevDependencies: true,
  globals: ['jest'],
};
