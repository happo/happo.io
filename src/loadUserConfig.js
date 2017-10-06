import requireRelative from 'require-relative';

import * as defaultConfig from './DEFAULTS';

function load(pathToConfigFile) {
  try {
    return Object.assign(defaultConfig,
      requireRelative(pathToConfigFile, process.cwd()));
  } catch (e) {
    // We only check for the default config file here, so that a missing custom
    // config path isn't ignored.
    if (e.message && /Cannot find.*\.happo\.js/.test(e.message)) {
      return defaultConfig;
    }
    throw new Error(e);
  }
}

export default function loadUserConfig(pathToConfigFile) {
  const config = load(pathToConfigFile);
  if (!config.apiKey || !config.apiSecret) {
    throw new Error('You need an `apiKey` and `apiSecret` in your config. ' +
      'To obtain one, go to https://happo.io/me');
  }
  if (!config.targets || Object.keys(config.targets).length === 0) {
    throw new Error('You need at least one target defined under `targets`. ' +
      'See https://github.com/enduire/happo.io#targets for more info.')
  }
  return config;
}
