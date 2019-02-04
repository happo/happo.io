import mkdirp from 'mkdirp';
import request from 'request-promise-native';
import requireRelative from 'require-relative';
import rimraf from 'rimraf';

import Logger from './Logger';
import WrappedError from './WrappedError';
import * as defaultConfig from './DEFAULTS';

function load(pathToConfigFile) {
  try {
    return Object.assign({}, defaultConfig, requireRelative(pathToConfigFile, process.cwd()));
  } catch (e) {
    // We only check for the default config file here, so that a missing custom
    // config path isn't ignored.
    if (e.message && /Cannot find.*\.happo\.js/.test(e.message)) {
      return defaultConfig;
    }
    throw new Error(e);
  }
}

async function getPullRequestSecret({ endpoint }, env) {
  const { secret } = await request({
    url: `${endpoint}/api/pull-request-token`,
    method: 'POST',
    json: true,
    body: {
      prUrl: env.CHANGE_URL,
    },
  });

  return secret;
}
export function initConfig(config) {
  rimraf.sync(config.tmpdir);
  mkdirp.sync(config.tmpdir);
  config.publicFolders.push(config.tmpdir);
  config.plugins.forEach(({ publicFolders }) => {
    if (publicFolders) {
      config.publicFolders.push(...publicFolders);
    }
  });
  return config;
}

export default async function loadUserConfig(pathToConfigFile, env = process.env) {
  const { CHANGE_URL } = env;

  const config = load(pathToConfigFile);
  if (!config.apiKey || !config.apiSecret) {
    if (!CHANGE_URL) {
      throw new Error(
        'You need an `apiKey` and `apiSecret` in your config. ' +
          'To obtain one, go to https://happo.io/settings',
      );
    }
    try {
      // Reassign api tokens to temporary ones provided for the PR
      new Logger().info('No `apiKey` or `apiSecret` found in config. Falling back to pull-request authentication.');
      config.apiKey = CHANGE_URL;
      config.apiSecret = await getPullRequestSecret(config, env);
    } catch (e) {
      throw new WrappedError('Failed to obtain temporary pull-request token', e);
    }
  }
  if (!config.targets || Object.keys(config.targets).length === 0) {
    throw new Error(
      'You need at least one target defined under `targets`. ' +
        'See https://github.com/happo/happo.io#targets for more info.',
    );
  }
  return initConfig(config);
}

