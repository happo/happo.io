import path from 'path';

import webpack from 'webpack';

import Logger from './Logger';

function generateBaseConfig({ entry, type, tmpdir }) {
  const outFile = `happo-bundle-${type}-${Buffer.from(process.cwd()).toString('base64')}.js`;
  const babelLoader = require.resolve('babel-loader');
  const baseConfig = {
    entry,
    output: {
      filename: outFile,
      path: tmpdir,
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
    plugins: [],
    devtool: 'eval',
  };
  if (type === 'react') {
    let babelPresetReact;
    try {
      // try with the babel 7 package
      babelPresetReact = require.resolve('@babel/preset-react');
    } catch (e) {
      // fall back to regular
      babelPresetReact = require.resolve('babel-preset-react');
    }

    const [babelRule] = baseConfig.module.rules;
    babelRule.test = /\.jsx?$/;
    babelRule.use.options = { presets: [babelPresetReact] };
  }
  return baseConfig;
}

export default async function createWebpackBundle(
  entry,
  { type, customizeWebpackConfig, plugins, tmpdir },
  { onBuildReady },
) {
  let config = generateBaseConfig({ entry, type, tmpdir });
  plugins.forEach((plugin) => {
    if (typeof plugin.customizeWebpackConfig === 'function') {
      config = plugin.customizeWebpackConfig(config);
    }
  });
  config = await customizeWebpackConfig(config);
  const compiler = webpack(config);
  const bundleFilePath = path.join(config.output.path, config.output.filename);

  if (onBuildReady) {
    // We're in watch/dev mode
    let hash;
    compiler.watch({}, (err, stats) => {
      if (err) {
        new Logger().error(err);
      } else if (stats.compilation.errors && stats.compilation.errors.length) {
        stats.compilation.errors.forEach(e => new Logger().error(e));
      } else if (hash !== stats.hash) {
        hash = stats.hash;
        onBuildReady(bundleFilePath);
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
      if (stats.compilation.errors && stats.compilation.errors.length) {
        reject(stats.compilation.errors[0]);
        return;
      }
      resolve(bundleFilePath);
    });
  });
}
