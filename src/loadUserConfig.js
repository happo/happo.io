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
    } else if (userConfig?.default) {
      // handle esm
      userConfig = userConfig.default;
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
    const ghEvent = require(GITHUB_EVENT_PATH);
    if (ghEvent.pull_request) {
      return ghEvent.pull_request.html_url;
    }
  }
}

export default async function loadUserConfig(pathToConfigFile, env = process.env) {
  const { CHANGE_URL, HAPPO_CONFIG_FILE } = env;

  if (HAPPO_CONFIG_FILE) {
    pathToConfigFile = HAPPO_CONFIG_FILE;
  }

  const config = await load(pathToConfigFile);
  if (!config.apiKey || !config.apiSecret) {
    const missing = [
      !config.apiKey ? 'apiKey' : null,
      !config.apiSecret ? 'apiSecret' : null,
    ]
      .filter(Boolean)
      .map((key) => `\`${key}\``)
      .join(' and ');

    const prUrl = CHANGE_URL || resolvePRLink(env);
    if (!prUrl) {
      throw new Error(
        `Missing ${missing} in your Happo config. Reference yours at https://happo.io/settings`,
      );
    }

    try {
      // Reassign API tokens to temporary ones provided for the PR
      new Logger().info(
        `Missing ${missing} in Happo config. Falling back to pull-request authentication.`,
      );
      config.apiKey = prUrl;
      config.apiSecret = await getPullRequestSecret(config, prUrl);
    } catch (e) {
      throw new WrappedError('Failed to obtain temporary pull-request token', e);
    }
  }

  if (!config.targets || Object.keys(config.targets).length === 0) {
    throw new Error(
      'You need at least one target defined under `targets` in your Happo config. See https://github.com/happo/happo.io#targets for more info.',
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
