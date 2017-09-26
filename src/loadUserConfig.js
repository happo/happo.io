import requireRelative from 'require-relative';

import * as defaultConfig from './DEFAULTS';

export default function loadUserConfig(pathToConfigFile) {
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
