import os from 'os';
import path from 'path';

import webpack from 'webpack';

function generateBaseConfig(entry, type) {
  const outFile = `happo-bundle-${type}-${Buffer.from(process.cwd()).toString('base64')}.js`;
  const babelLoader = require.resolve('babel-loader');
  const baseConfig = {
    entry,
    output: {
      filename: outFile,
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
  const bundleFilePath = path.join(config.output.path, config.output.filename);

  if (onBuildReady) {
    // We're in watch/dev mode
    let hash;
    compiler.watch({}, (err, stats) => {
      if (err) {
        console.log(err);
      } else if (hash !== stats.hash) {
        hash = stats.hash;
        onBuildReady(bundleFilePath);
      }
    });
    return;
  }

  // We're not in watch/dev mode
  return new Promise((resolve, reject) => {
    compiler.run((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(bundleFilePath);
    });
  });
}
