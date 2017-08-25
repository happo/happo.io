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
    withJSDom(() => {
      require(webpackBundle);
      const globalCSS = extractCSS();

      console.log('global css', globalCSS);

      console.log(global.snaps);
      Object.keys(global.snaps).forEach((file) => {
        Object.keys(global.snaps[file]).forEach((name) => {
          withJSDom(() => {
            console.log(processSnap({
              name: file + name,
              renderFunc: global.snaps[file][name],
            }));
          })
        })
      });
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
