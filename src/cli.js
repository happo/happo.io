#!/usr/bin/env node

import 'babel-polyfill';

import commander from 'commander';
import requireRelative from 'require-relative';

import PreviewServer from './PreviewServer';
import createDynamicEntryPoint from './createDynamicEntryPoint';
import createWebpackBundle from './createWebpackBundle';
import packageJson from '../package.json';
import processSnapsInBundle from './processSnapsInBundle';

commander
  .version(packageJson.version)
  .usage('[options] <regexForTestName>')
  .parse(process.argv);

const userConfig = requireRelative('./.enduire.js', process.cwd());

const previewServer = new PreviewServer();
previewServer.start();

(async function() {
  console.log('Generating entry point...');
  const entryFile = await createDynamicEntryPoint(userConfig);

  console.log('Producing bundle...');
  const bundleFile = await createWebpackBundle(entryFile, userConfig);

  console.log('Executing bundle...');
  const snaps = await processSnapsInBundle(bundleFile);

  previewServer.updateSnaps(snaps);
})();
