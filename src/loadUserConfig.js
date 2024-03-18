import fetch from 'node-fetch';
import requireRelative from 'require-relative';

import Logger from './Logger';
import WrappedError from './WrappedError';
import * as defaultConfig from './DEFAULTS';

async function load(pathToConfigFile) {
  let userConfig = requireRelative(pathToConfigFile, process.cwd());
  // await if the config is a function, async or not
  if (typeof userConfig === 'function') {
    userConfig = await userConfig();
  }
  return { ...defaultConfig, ...userConfig };
}

async function getPullRequestSecret({ endpoint }, prUrl) {
  const res = await fetch(`${endpoint}/api/pull-request-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prUrl }),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to get pull request secret: ${res.status} - ${await res.text()}`,
    );
  }
  const { secret } = await res.json();
  return secret;
}

function resolvePRLink(env = process.env) {
  const { GITHUB_EVENT_PATH } = env;

  if (GITHUB_EVENT_PATH) {
    // eslint-disable-next-line import/no-dynamic-require
    const ghEvent = require(GITHUB_EVENT_PATH);
    if (ghEvent.pull_request) {
      return ghEvent.pull_request.html_url;
    }
  }
}

export default async function loadUserConfig(pathToConfigFile, env = process.env) {
  const { CHANGE_URL, HAPPO_CONFIG_FILE } = env;
  let config;

  if (HAPPO_CONFIG_FILE) {
    pathToConfigFile = HAPPO_CONFIG_FILE;
  }

  // if provided path, attempt to load config. otherwise, attempt to load
  // config from default file (in either .js or .cjs).
  if (pathToConfigFile) {
    config = await load(pathToConfigFile);
  } else {
    const defaultFilePaths = ['js', 'cjs'].map(
      (ext) => `./${defaultConfig.configFilename}.${ext}`,
    );
    for (const filePath of defaultFilePaths) {
      try {
        config = await load(filePath);

        if (config != null) {
          break;
        }
      } catch (e) {
        // Throw error if not a "Cannot find" type
        if (!e.message || !/Cannot find.*\.happo\.c?js/.test(e.message)) {
          throw new Error(`Unable to load config from ${filePath}: ${e.message}`);
        }
      }
    }

    // No default file found so use the default config
    if (config == null) {
      config = { ...defaultConfig };
    }
  }

  if (!config.apiKey || !config.apiSecret) {
    const prUrl = CHANGE_URL || resolvePRLink(env);
    if (!prUrl) {
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
      config.apiKey = prUrl;
      config.apiSecret = await getPullRequestSecret(config, prUrl);
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
