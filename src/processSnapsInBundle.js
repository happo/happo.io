import fs from 'fs';

import { JSDOM } from 'jsdom';

import createHash from './createHash';
import extractCSS from './extractCSS';
import getComponentNameFromFileName from './getComponentNameFromFileName';
import inlineResources from './inlineResources';

function renderCurrentExample(dom) {
  const html = dom.window.eval(`
    document.body.innerHTML = '';
    const rootElement = document.createElement('div');
    rootElement.setAttribute('id', 'happo-root');
    document.body.appendChild(rootElement);
    const reactComponent = window.renderCurrentComponent();
    if (typeof reactComponent === 'string') {
      throw new Error('Component is a string');
    }
    ReactDOM.render(reactComponent, rootElement);
    rootElement.innerHTML;
  `);

  return {
    css: '', // todo: look into removing this
    html,
  }
}
function processVariants({ dom, component, variants, only, publicFolders }) {
  if (only && only !== component) {
    return [];
  }
  return Object.keys(variants).map(variant => {
    const hash = createHash(`${component}|${variant}`);
    const renderFunc = variants[variant];
    if (typeof renderFunc !== 'function') {
      // Some babel loaders add additional properties to the exports.
      // Ignore those that aren't functions.
      return;
    }
    dom.window.renderCurrentComponent = renderFunc;
    // console.log(`  - ${variant} | http://localhost:2999/${hash}`);
    const result = Object.assign({}, renderCurrentExample(dom), {
      component,
      variant,
      hash,
    });
    if (publicFolders && publicFolders.length) {
      result.html = inlineResources(dom, { publicFolders });
    }
    return result;
  }).filter(Boolean);
}

export default function processSnapsInBundle(webpackBundle, {
  globalCSS,
  only,
  publicFolders,
}) {
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
      snapPayloads: [],
    };

    Object.keys(dom.window.snaps).forEach(fileName => {
      const objectOrArray = dom.window.snaps[fileName];
      if (Array.isArray(objectOrArray)) {
        objectOrArray.forEach(({ component, variants }) => {
          result.snapPayloads.push(...processVariants({
            dom,
            component,
            variants,
            only,
            publicFolders,
          }));
        });
      } else {
        const component = getComponentNameFromFileName(fileName);
        result.snapPayloads.push(...processVariants({
          dom,
          component,
          variants: objectOrArray,
          only,
          publicFolders,
        }));
      }
    });
    result.globalCSS = globalCSS + extractCSS(dom);
    dom.window.close();
    resolve(result);
  });
}
