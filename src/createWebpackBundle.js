import os from 'os';
import path from 'path';

import requireRelative from 'require-relative';
import webpack from 'webpack';

const OUTFILE = `happo-bundle-${Buffer.from(process.cwd()).toString('base64')}.js`;

function generateBaseConfig(entry, type) {
  const babelLoader = require.resolve('babel-loader');
  const baseConfig = {
    entry,
    output: {
      filename: OUTFILE,
      path: os.tmpdir(),
    },
    resolve: {
      extensions: ['*', '.js', '.jsx', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: babelLoader,
          },
        },
      ],
    },
  };
  if (type === 'react') {
    const babelPresetReact = require.resolve('babel-preset-react');

    const [babelRule] = baseConfig.module.rules;
    babelRule.test = /\.jsx?$/;
    babelRule.use.options = { presets: [babelPresetReact] };
  }
  return baseConfig;
}

export default function createWebpackBundle(
  entry,
  { type, customizeWebpackConfig },
  { onBuildReady },
) {
  const config = customizeWebpackConfig(generateBaseConfig(entry, type));
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
