import fs from 'fs';

import { JSDOM } from 'jsdom';

import createHash from './createHash';
import extractCSS from './extractCSS';
import processSnap from './processSnap';

export default function processSnapsInBundle(webpackBundle, { globalCSS }) {
  return new Promise((resolve, reject) => {
    const dom = new JSDOM(
      '<!DOCTYPE html><head></head><body></body></html>',
      {
        runScripts: 'outside-only',
      }
    );

    // Parse and execute the webpack bundle in a jsdom environment
    const bundleContent = fs.readFileSync(webpackBundle, { encoding: 'utf-8' });
    dom.window.eval(bundleContent);

    const result = {
      globalCSS: globalCSS + extractCSS(dom),
      snapPayloads: [],
    };

    Object.keys(dom.window.snaps).forEach(component => {
      Object.keys(dom.window.snaps[component]).forEach(variant => {
        const hash = createHash(`${component}|${variant}`);
        const renderFunc = dom.window.snaps[component][variant];
        if (typeof renderFunc !== 'function') {
          // Some babel loaders add additional properties to the exports.
          // Ignore those that aren't functions.
          return;
        }
        // console.log(`  - ${variant} | http://localhost:2999/${hash}`);
        result.snapPayloads.push(
          Object.assign({}, processSnap(dom, { component, variant }), {
            component,
            variant,
            hash,
          })
        );
      });
    });
    resolve(result);
  });
}
