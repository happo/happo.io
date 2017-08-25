#!/usr/bin/env node

import commander from 'commander';

import createDynamicEntryPoint from './createDynamicEntryPoint';
import createWebpackBundle from './createWebpackBundle';
import extractCSS from './extractCSS';
import packageJson from '../package.json';
import processSnap from './processSnap';
import withJSDom from './withJSDom';

commander.version(packageJson.version).usage('[options] <regexForTestName>').parse(process.argv);

createDynamicEntryPoint()
  .then(createWebpackBundle)
  .then((webpackBundle) => {
    let globalCSS;
    withJSDom(() => {
      require(webpackBundle);
      globalCSS = extractCSS();
    });

    console.log('global css', globalCSS);

    Object.keys(global.snaps).forEach((name) => {
      withJSDom(() => {
        console.log(processSnap({
          name,
          renderFunc: global.snaps[name],
        }));
      })
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
