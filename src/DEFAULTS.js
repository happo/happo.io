import os from 'os';
import path from 'path';

import RemoteBrowserTarget from './RemoteBrowserTarget';
import createHash from './createHash';

const cwdUniqueFolderName = `happo-tmp-${createHash(process.cwd()).slice(0, 5)}`;

export const apiKey = process.env.HAPPO_API_KEY;
export const apiSecret = process.env.HAPPO_API_SECRET;
export const endpoint = 'https://happo.io';
export const include = '**/@(*-happo|happo).@(js|jsx|ts|tsx)';
export const stylesheets = [];
export const setupScript = undefined;
export const project = undefined;
export const targets = {
  chrome: new RemoteBrowserTarget('chrome', {
    viewport: '1024x768',
  }),
};
export const asyncTimeout = 200;
export const configFile = './.happo.js';
export const type = 'react';
export const plugins = [];
export const prerender = true;
export const publicFolders = [];
export const tmpdir = path.join(os.tmpdir(), cwdUniqueFolderName);
export const renderWrapperModule = require.resolve('./renderWrapper');
export const githubApiUrl = 'https://api.github.com';
export function customizeWebpackConfig(config) {
  // provide a default no-op for this config option so that we can assume it's
  // always there.
  return config;
}
