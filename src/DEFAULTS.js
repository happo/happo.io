import reactDOMRunner from './reactDOMRunner';

export const viewerEndpoint = 'https://happo.now.sh';
export const snapEndpoint = 'https://happo-snap.now.sh';
export const include = '**/@(*-snaps|snaps).@(js|jsx)';
export const stylesheets = [];
export const targets = {};
export const configFile = './.happo.js';
export const hooks = {
  run: reactDOMRunner,
  finish: (result) => {
    console.log(result);
  }
}
