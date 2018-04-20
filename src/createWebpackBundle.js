import os from 'os';
import path from 'path';

import requireRelative from 'require-relative';
import webpack from 'webpack';

const OUTFILE = `happo-bundle-${Buffer.from(process.cwd()).toString('base64')}.js`;

export default function createWebpackBundle(entry, { customizeWebpackConfig }, {
  onBuildReady,
}) {
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

  const compiler = webpack(config);
  const bundleFilePath = path.join(os.tmpdir(), OUTFILE);

  if (onBuildReady) {
    // We're in watch/dev mode
    let hash;
    compiler.watch({}, (err, stats) => {
      if (err) {
        console.log(err);
      } else {
        if (hash !== stats.hash) {
          hash = stats.hash;
          onBuildReady(bundleFilePath);
        }
      }
    });
    return;
  }

  // We're not in watch/dev mode
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(bundleFilePath);
    });
  });
}
