#!/usr/bin/env node

import 'babel-polyfill';

import commander from 'commander';

import PreviewServer from './PreviewServer';
import createDynamicEntryPoint from './createDynamicEntryPoint';
import createWebpackBundle from './createWebpackBundle';
import loadCSSFile from './loadCSSFile';
import loadUserConfig from './loadUserConfig';
import packageJson from '../package.json';
import processSnapsInBundle from './processSnapsInBundle';

commander
  .version(packageJson.version)
  .usage('[options] <regexForTestName>')
  .parse(process.argv);

const {
  setupScript,
  webpackLoaders,
  stylesheets = [],
} = loadUserConfig();

const previewServer = new PreviewServer();
previewServer.start();

(async function() {
  console.log('Generating entry point...');
  const entryFile = await createDynamicEntryPoint({ setupScript });

  console.log('Producing bundle...');
  const bundleFile = await createWebpackBundle(entryFile, { webpackLoaders });

  const cssBlocks = await Promise.all(stylesheets.map(loadCSSFile));

  console.log('Executing bundle...');
  const snaps = await processSnapsInBundle(bundleFile, {
    globalCSS: cssBlocks.join(''),
  });

  previewServer.updateSnaps(snaps);
})();
