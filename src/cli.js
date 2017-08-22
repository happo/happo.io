#!/usr/bin/env node

import commander from 'commander';
import requireRelative from 'require-relative';

import { getSnaps } from './snap';
import findTestFiles from './findTestFiles';
import packageJson from '../package.json';

commander
  .version(packageJson.version)
  .usage('[options] <regexForTestName>')
  .parse(process.argv);


findTestFiles().then((files) => {
  files.forEach((file) => {
    const exported = requireRelative(`./${file}`, process.cwd());
    console.log(file, exported);
  });
});
