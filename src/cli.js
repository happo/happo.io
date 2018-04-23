#!/usr/bin/env node

import 'babel-polyfill';

import executeCli from './executeCli';

process.on('unhandledRejection', error => {
  console.error(error.stack);
  process.exit(1);
});

executeCli(process.argv);
