import path from 'path';

import Logger from './Logger';

const babelPresetReact = require.resolve('@babel/preset-react');

const { VERBOSE = 'false' } = process.env;

function getWebpack() {
  return require('webpack');
}

function generateBaseConfig({ entry, type, tmpdir, webpack }) {
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
  const usedWebpack = webpack || getWebpack();
  if (/^[4567]\./.test(usedWebpack.version)) {
    if (VERBOSE === 'true') {
      console.log('Detected webpack version >=4. Using `mode: "development"`.');
    }
    baseConfig.mode = 'development';
    if (/^[567]\./.test(usedWebpack.version)) {
      if (VERBOSE === 'true') {
        console.log(
          'Detected webpack version >=5. Adding no-op fallback for "path".',
        );
      }
      baseConfig.resolve.fallback = { path: false };
    }
  } else if (VERBOSE === 'true') {
    console.log(
      'Detected webpack version <4. If you upgrade to >=4, stack traces from Happo will be a little better.',
    );
  }
  if (type === 'react') {
    const [babelRule] = baseConfig.module.rules;
    babelRule.test = /\.jsx?$/;
    babelRule.use.options.presets = [babelPresetReact];
  }
  return baseConfig;
}

export default async function createWebpackBundle(
  entry,
  { type, customizeWebpackConfig, plugins, tmpdir, webpack },
  { onBuildReady },
) {
  let config = generateBaseConfig({ entry, type, tmpdir, webpack });
  for (const plugin of plugins) {
    if (typeof plugin.customizeWebpackConfig === 'function') {
      config = await plugin.customizeWebpackConfig(config);
    }
  }
  config = await customizeWebpackConfig(config);
  if (VERBOSE === 'true') {
    console.log('Using this webpack config:');
    console.log(config);
  }

  const compiler = (webpack || getWebpack())(config);
  const bundleFilePath = path.join(config.output.path, config.output.filename);

  if (onBuildReady) {
    // We're in watch/dev mode
    let hash;
    compiler.watch({}, (err, stats) => {
      if (err) {
        new Logger().error(err);
      } else if (stats.compilation.errors && stats.compilation.errors.length) {
        stats.compilation.errors.forEach((e) => new Logger().error(e));
      } else if (hash !== stats.hash) {
        hash = stats.hash;

        // Call the timeout on next tick to allow webpack to fully write the
        // bundle to the bundleFilePath
        setTimeout(() => onBuildReady(bundleFilePath));
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
