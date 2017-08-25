import os from 'os';
import path from 'path';

import requireRelative from 'require-relative';
import webpack from 'webpack';

const OUTFILE = 'enduire.js';

const webpackConfig = requireRelative('./webpack.enduire.js', process.cwd());

export default function createWebpackBundle(entry) {
  return new Promise((resolve, reject) => {
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
          reject(err);
          return;
        }
        resolve(path.join(os.tmpdir(), OUTFILE));
      },
    );
  });
}
