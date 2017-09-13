#!/usr/bin/env node

import 'babel-polyfill';

import colors from 'colors/safe';
import commander from 'commander';
import request from 'request-promise-native';

import createDynamicEntryPoint from './createDynamicEntryPoint';
import createWebpackBundle from './createWebpackBundle';
import getCurrentSnapshots from './getCurrentSnapshots';
import loadCSSFile from './loadCSSFile';
import loadUserConfig from './loadUserConfig';
import packageJson from '../package.json';
import processSnapsInBundle from './processSnapsInBundle';
import saveCurrentSnapshots from './saveCurrentSnapshots';

commander
  .version(packageJson.version)
  .usage('[options] <regexForTestName>')
  .parse(process.argv);

const {
  setupScript,
  webpackLoaders,
  stylesheets = [],
} = loadUserConfig();

// const previewServer = new PreviewServer();
// previewServer.start();

(async function() {
  console.log('Generating entry point...');
  const entryFile = await createDynamicEntryPoint({ setupScript });

  console.log('Producing bundle...');
  const bundleFile = await createWebpackBundle(entryFile, { webpackLoaders });

  const cssBlocks = await Promise.all(stylesheets.map(loadCSSFile));

  console.log('Executing bundle...');
  const snaps = await processSnapsInBundle(bundleFile, {
    globalCSS: cssBlocks.join('').replace(/\n/g, ''),
  });

  console.log('Sending payload to remote service...');
  const result = await request.post({
    url: 'http://localhost:4433/snap',
    method: 'POST',
    json: true,
    body: snaps,
  });

  console.log('\n\nResults: \n');

  const currentSnapshots = getCurrentSnapshots();

  let currentFile;
  result.forEach(({ name, file, url }) => {
    if (currentFile !== file) {
      console.log(file);
      currentFile = file;
    }
    if (!currentSnapshots[file]) {
      currentSnapshots[file] = {};
    }
    const oldUrl = currentSnapshots[file][name];
    if (!oldUrl) {
      currentSnapshots[file][name] = url;
      console.log(colors.cyan(`  + ${name} | ${url}`));
    } else if (oldUrl !== url) {
      currentSnapshots[file][name] = url;
      console.log(colors.red(`  • ${name} | ${url}`));
    } else {
      console.log(colors.green(`  ✓ ${name} | ${url}`));
    }
  });
  await saveCurrentSnapshots(currentSnapshots);
})();
