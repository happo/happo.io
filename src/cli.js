#!/usr/bin/env node

import 'babel-polyfill';

import commander from 'commander';

import { getPreviousSha, setPreviousSha } from './previousSha';
import constructReport from './constructReport';
import createDynamicEntryPoint from './createDynamicEntryPoint';
import createWebpackBundle from './createWebpackBundle';
import getSha from './getSha';
import loadCSSFile from './loadCSSFile';
import loadUserConfig from './loadUserConfig';
import packageJson from '../package.json';
import processSnapsInBundle from './processSnapsInBundle';
import uploadReport from './uploadReport';

commander
  .version(packageJson.version)
  .usage('[options] <regexForTestName>')
  .parse(process.argv);

const {
  apiKey,
  apiSecret,
  setupScript,
  webpackLoaders,
  stylesheets = [],
  include = '**/@(*-snaps|snaps).@(js|jsx)',
  targets = {},
  //viewerEndpoint = 'http://localhost:4432',
  viewerEndpoint = 'https://happo.now.sh',
} = loadUserConfig();

// const previewServer = new PreviewServer();
// previewServer.start();

(async function() {
  const sha = await getSha();
  const previousSha = getPreviousSha();

  console.log('Generating entry point...');
  const entryFile = await createDynamicEntryPoint({ setupScript, include });

  console.log('Producing bundle...');
  const bundleFile = await createWebpackBundle(entryFile, { webpackLoaders });

  const cssBlocks = await Promise.all(stylesheets.map(loadCSSFile));

  console.log('Executing bundle...');
  const snapPayloads = await processSnapsInBundle(bundleFile, {
    globalCSS: cssBlocks.join('').replace(/\n/g, ''),
  });

  console.log('Generating screenshots...');
  const results = await Promise.all(Object.keys(targets).map(async (name) => {
    const target = targets[name];
    const result = await target.execute(snapPayloads);
    return {
      name,
      result,
    };
  }));

  const snaps = await constructReport(results);
  await uploadReport({
    snaps,
    sha,
    endpoint: viewerEndpoint,
    apiKey,
    apiSecret,
  });

  setPreviousSha(sha);

  if (previousSha) {
    console.log(`${viewerEndpoint}/report?q=${previousSha}..${sha}`);
  } else {
    console.log('No previous report found');
  }
})();
