#!/usr/bin/env node

import os from 'os';
import path from 'path';

import { JSDOM } from 'jsdom';
import commander from 'commander';
import requireRelative from 'require-relative';
import webpack from 'webpack';

import createDynamicEntryPoint from './createDynamicEntryPoint';
import packageJson from '../package.json';
import processSnap from './processSnap';
import snap from './snap';

const OUTFILE = 'enduire.js';

const webpackConfig = requireRelative('./webpack.enduire.js', process.cwd());

commander.version(packageJson.version).usage('[options] <regexForTestName>').parse(process.argv);

createDynamicEntryPoint().then(entry => {
  webpack(
    Object.assign(
      {
        entry,
        resolve: {
          extensions: ['*', '.js', '.jsx', '.json'],
        },
        output: {
          filename: OUTFILE,
          path: os.tmpdir(),
        },
        target: 'node',
        externals: {
          enduire: 'global.enduire',
        },
      },
      webpackConfig,
    ),
    (err, stats) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      const dom = new JSDOM();
      global.window = dom.window;
      global.XMLHttpRequest = dom.window.XMLHttpRequest;
      global.document = dom.window.document;
      global.enduire = { snap };
      require(path.join(os.tmpdir(), OUTFILE));
      Object.keys(global.snaps).forEach((name) => {
        console.log(processSnap({
          name,
          renderFunc: global.snaps[name],
        }));
      });
    },
  );
});
