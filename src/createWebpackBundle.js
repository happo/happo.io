import path from 'path';

import Logger from './Logger';

const { VERBOSE = 'false' } = process.env;

function getWebpack() {
  return require('webpack');
}

function generateBaseConfig({ entry, type, tmpdir }) {
  const babelLoader = require.resolve('babel-loader');
  const baseConfig = {
    devtool: 'nosources-source-map',
    entry,
    output: {
      filename: 'happo-bundle.js',
      path: tmpdir,
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    },
    resolve: {
      extensions: ['*', '.js', '.jsx', '.json', '.ts', '.tsx'],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: babelLoader,
            options: {
              plugins: [require.resolve('babel-plugin-dynamic-import-node')],
            },
          },
        },
      ],
    },
    plugins: [],
  };
  if (/^[4567]\./.test(getWebpack().version)) {
    if (VERBOSE === 'true') {
      console.log('Detected webpack version >=4. Using `mode: "development"`.');
    }
    baseConfig.mode = 'development';
  } else if (VERBOSE === 'true') {
    console.log('Detected webpack version <4. If you upgrade to >=4, stack traces from Happo will be a little better.');
  }
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
    babelRule.use.options.presets = [babelPresetReact];
  }
  return baseConfig;
}

export default async function createWebpackBundle(
  entry,
  { type, customizeWebpackConfig, plugins, tmpdir },
  { onBuildReady },
) {
  let config = generateBaseConfig({ entry, type, tmpdir });
  for (const plugin of plugins) {
    if (typeof plugin.customizeWebpackConfig === 'function') {
      config = await plugin.customizeWebpackConfig(config); // eslint-disable-line no-await-in-loop
    }
  }
  config = await customizeWebpackConfig(config);
  if (VERBOSE === 'true') {
    console.log('Using this webpack config:');
    console.log(config);
  }
  const compiler = getWebpack()(config);
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
      if (VERBOSE === 'true') {
        console.log('Webpack stats:');
        console.log(stats.toJson('verbose'));
      }
      if (stats.compilation.errors && stats.compilation.errors.length) {
        reject(stats.compilation.errors[0]);
        return;
      }
      resolve(bundleFilePath);
    });
  });
}
