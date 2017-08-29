#!/usr/bin/env node

import 'babel-polyfill';

import commander from 'commander';

import PreviewServer from './PreviewServer';
import createDynamicEntryPoint from './createDynamicEntryPoint';
import createWebpackBundle from './createWebpackBundle';
import packageJson from '../package.json';
import processSnapsInBundle from './processSnapsInBundle';

commander
  .version(packageJson.version)
  .usage('[options] <regexForTestName>')
  .parse(process.argv);

const previewServer = new PreviewServer();
previewServer.start();

(async function() {
  console.log('Generating entry point...');
  const entryFile = await createDynamicEntryPoint();

  console.log('Producing bundle...');
  const bundleFile = await createWebpackBundle(entryFile);

  console.log('Executing bundle...');
  const snaps = await processSnapsInBundle(bundleFile);

  previewServer.updateSnaps(snaps);
})();
