import os from 'os';
import path from 'path';

import requireRelative from 'require-relative';
import webpack from 'webpack';

const OUTFILE = 'enduire.js';

export default function createWebpackBundle(entry, { webpackLoaders }) {
  return new Promise((resolve, reject) => {
    webpack(
      {
        entry,
        resolve: {
          extensions: ['*', '.js', '.jsx', '.json'],
        },
        output: {
          filename: OUTFILE,
          path: os.tmpdir(),
        },
        module: {
          rules: webpackLoaders,
        },
      },
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
