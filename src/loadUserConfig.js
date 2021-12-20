import fetch from 'node-fetch';
import requireRelative from 'require-relative';

import Logger from './Logger';
import WrappedError from './WrappedError';
import * as defaultConfig from './DEFAULTS';

async function load(pathToConfigFile) {
  try {
    let userConfig = requireRelative(pathToConfigFile, process.cwd());
    // await if the config is a function, async or not
    if (typeof userConfig === 'function') {
      userConfig = await userConfig();
    }
    return { ...defaultConfig, ...userConfig };
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
  const res = await fetch(`${endpoint}/api/pull-request-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prUrl: env.CHANGE_URL,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to get pull request secret: ${res.status} - ${await res.text()}`);
  }
  const { secret } = await res.json();
  return secret;
}

export default async function loadUserConfig(pathToConfigFile, env = process.env) {
  const { CHANGE_URL, HAPPO_CONFIG_FILE } = env;

  if (HAPPO_CONFIG_FILE) {
    pathToConfigFile = HAPPO_CONFIG_FILE;
  }

  const config = await load(pathToConfigFile);
  if (!config.apiKey || !config.apiSecret) {
    if (!CHANGE_URL) {
      throw new Error(
        'You need an `apiKey` and `apiSecret` in your config. ' +
          'To obtain one, go to https://happo.io/settings',
      );
    }
    try {
      // Reassign api tokens to temporary ones provided for the PR
      new Logger().info(
        'No `apiKey` or `apiSecret` found in config. Falling back to pull-request authentication.',
      );
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
  const defaultKeys = Object.keys(defaultConfig);
  const usedKeys = Object.keys(config);
  usedKeys.forEach((key) => {
    if (!defaultKeys.includes(key)) {
      new Logger().warn(`Unknown config key used in .happo.js: "${key}"`);
    }
  });
  config.publicFolders.push(config.tmpdir);
  config.plugins.forEach(({ publicFolders }) => {
    if (publicFolders) {
      config.publicFolders.push(...publicFolders);
    }
  });
  return config;
}
