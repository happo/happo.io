import domRunner from './domRunner';

export const endpoint = 'https://happo.io';
export const include = '**/@(*-happo|happo).@(js|jsx)';
export const stylesheets = [];
export const targets = {};
export const configFile = './.happo.js';
export const render = () => null;
export const hooks = {
  run: domRunner,
  finish: (result) => {
    console.log(result);
  }
}
export function customizeWebpackConfig(config) {
  // provide a default no-op for this config option so that we can assume it's
  // always there.
  return config;
}
