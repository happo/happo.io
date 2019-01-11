#!/usr/bin/env node

import 'babel-polyfill';

import fs from 'fs';

import sourceMaps from 'source-map-support';

import Logger from './Logger';
import executeCli from './executeCli';

sourceMaps.install({
  retrieveFile: (filePath) => {
    const prefix = 'file://';

    if (!filePath.startsWith(prefix)) {
      return;
    }
    const realPath = filePath.slice(prefix.length);
    return fs.readFileSync(realPath, 'utf-8');
  },
});

function printErrorIter(error, logger) {
  logger.error(error);
  if (error.cause) {
    logger.error('Caused by:');
    printErrorIter(error.cause, logger);
  }
}

process.on('unhandledRejection', (error) => {
  printErrorIter(error, new Logger());
  process.exit(1);
});

executeCli(process.argv);
