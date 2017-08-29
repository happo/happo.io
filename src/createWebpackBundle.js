import os from 'os';
import path from 'path';

import requireRelative from 'require-relative';
import webpack from 'webpack';

const OUTFILE = 'enduire.js';

const userConfig = requireRelative('./.enduire.js', process.cwd());

export default function createWebpackBundle(entry) {
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
        target: 'node',
        module: {
          rules: userConfig.webpackLoaders,
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
