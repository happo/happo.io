import os from 'os';

import RemoteBrowserTarget from './RemoteBrowserTarget';

export const apiKey = process.env.HAPPO_API_KEY;
export const apiSecret = process.env.HAPPO_API_SECRET;
export const endpoint = 'https://happo.io';
export const include = '**/@(*-happo|happo).@(js|jsx|ts|tsx)';
export const stylesheets = [];
export const targets = {
  chrome: new RemoteBrowserTarget('chrome', {
    viewport: '1024x768',
  }),
};
export const configFile = './.happo.js';
export const type = 'react';
export const plugins = [];
export const publicFolders = [];
export const tmpdir = os.tmpdir();
export const renderWrapperModule = require.resolve('./renderWrapper');
export function customizeWebpackConfig(config) {
  // provide a default no-op for this config option so that we can assume it's
  // always there.
  return config;
}
