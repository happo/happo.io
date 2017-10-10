import os from 'os';
import path from 'path';

import requireRelative from 'require-relative';
import webpack from 'webpack';

const OUTFILE = 'happo.js';

export default function createWebpackBundle(entry, { customizeWebpackConfig }) {
  const config = customizeWebpackConfig({
    entry,
    resolve: {
      extensions: ['*', '.js', '.jsx', '.json'],
    },
    output: {
      filename: OUTFILE,
      path: os.tmpdir(),
    },
  });

  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(path.join(os.tmpdir(), OUTFILE));
    });
  });
}
