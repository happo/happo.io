#!/usr/bin/env node

import '@babel/polyfill';

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

    try {
      return fs.readFileSync(realPath, 'utf-8');
    } catch (e) {
      // If the file does not exist (e.g. if `devtool: false` is used in
      // webpack config), just let source-map-support do its normal thing
      // without erroring out here. This should work because
      // source-map-support will use the result of the first handler that does
      // not return null:
      // https://github.com/evanw/node-source-map-support/blob/50642d69/source-map-support.js#L62-L72
      return null;
    }
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
  throw error;
});

executeCli(process.argv);
