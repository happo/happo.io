import os from 'os';
import path from 'path';

import requireRelative from 'require-relative';
import webpack from 'webpack';
import webpackNodeExternals from 'webpack-node-externals';

const OUTFILE = 'happo.js';

export default function createWebpackBundle(entry, { customizeWebpackConfig }, {
  onBuildReady,
}) {
  const config = customizeWebpackConfig({
    entry,
    resolve: {
      extensions: ['*', '.js', '.jsx', '.json'],
    },
    externals: [webpackNodeExternals()],
    devtool: 'inline-cheap-module-source-map',
    output: {
      filename: OUTFILE,
      path: process.cwd(),
    },
    target: 'node',
  });

  const compiler = webpack(config);
  const bundleFilePath = path.join(process.cwd(), OUTFILE);

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
