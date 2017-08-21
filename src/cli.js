#!/usr/bin/env node

import commander from 'commander';

import { getSnaps } from './snap';
import findTestFiles from './findTestFiles';
import packageJson from '../package.json';

commander
  .version(packageJson.version)
  .usage('[options] <regexForTestName>')
  .parse(process.argv);


findTestFiles().then((files) => {
  console.log(files);
});
