#!/usr/bin/env node

import 'babel-polyfill';

import Logger from './Logger';
import executeCli from './executeCli';

process.on('unhandledRejection', (error) => {
  new Logger().error(error);
  process.exit(1);
});

executeCli(process.argv);
