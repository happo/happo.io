#!/usr/bin/env node

import 'babel-polyfill';

import commander from 'commander';

import constructReport from './constructReport';
import createDynamicEntryPoint from './createDynamicEntryPoint';
import createWebpackBundle from './createWebpackBundle';
import loadCSSFile from './loadCSSFile';
import loadUserConfig from './loadUserConfig';
import packageJson from '../package.json';
import processSnapsInBundle from './processSnapsInBundle';
import saveReport from './saveReport';

commander
  .version(packageJson.version)
  .usage('[options] <regexForTestName>')
  .parse(process.argv);

const {
  setupScript,
  webpackLoaders,
  stylesheets = [],
  include = '**/@(*-snaps|snaps).@(js|jsx)',
  targets = {},
} = loadUserConfig();

// const previewServer = new PreviewServer();
// previewServer.start();

(async function() {
  console.log('Generating entry point...');
  const entryFile = await createDynamicEntryPoint({ setupScript, include });

  console.log('Producing bundle...');
  const bundleFile = await createWebpackBundle(entryFile, { webpackLoaders });

  const cssBlocks = await Promise.all(stylesheets.map(loadCSSFile));

  console.log('Executing bundle...');
  const snaps = await processSnapsInBundle(bundleFile, {
    globalCSS: cssBlocks.join('').replace(/\n/g, ''),
  });

  console.log('Generating screenshots...');
  const results = await Promise.all(Object.keys(targets).map(async (name) => {
    const target = targets[name];
    const result = await target.execute(snaps);
    return {
      name,
      result,
    };
  }));

  console.log('\n\nResults: \n');
  const { summary, report } = await constructReport(results);
  if (summary.allGreen) {
    process.exit(0);
  } else {
    await saveReport(report);
    process.exit(1);
  }
})();
