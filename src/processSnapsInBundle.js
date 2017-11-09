import fs from 'fs';

import { JSDOM } from 'jsdom';

import createHash from './createHash';
import extractCSS from './extractCSS';
import getComponentNameFromFileName from './getComponentNameFromFileName';
import inlineResources from './inlineResources';
import queued from './queued';

async function renderExample(dom, renderMethod) {
  const doc = dom.window.document;
  doc.body.innerHTML = '';
  const rootElement = doc.createElement('div');
  doc.body.appendChild(rootElement);

  const renderInDOM = (reactComponent) => {
    if (typeof reactComponent === 'string') {
      throw new Error('Component is a string');
    }
    dom.window.reactComponent = reactComponent;
    dom.window.rootElement = rootElement;
    dom.window.eval(`
      ReactDOM.render(window.reactComponent, window.rootElement);
    `);
  }

  const result = renderMethod(renderInDOM, dom.window.document);
  if (typeof result.then === 'function') {
    // this is a promise
    return await result;
  }
  renderInDOM(result);
}
async function processVariants({
  dom,
  component,
  variants,
  only,
  publicFolders,
  getRootElement,
}) {
  if (only && only !== component) {
    return [];
  }
  const result = await queued(Object.keys(variants), async (variant) => {
    const hash = createHash(`${component}|${variant}`);
    const renderFunc = variants[variant];
    if (typeof renderFunc !== 'function') {
      // Some babel loaders add additional properties to the exports.
      // Ignore those that aren't functions.
      return;
    }
    await renderExample(dom, renderFunc);

    if (publicFolders && publicFolders.length) {
      inlineResources(dom, { publicFolders });
    }
    const root = getRootElement(dom.window.document) || dom.window.rootElement;
    const html = root.innerHTML.trim();
    return {
      html,
      css: '', // Can we remove this?
      component,
      variant,
      hash,
    };
  });

  return result.filter(Boolean);
}

export default async function processSnapsInBundle(webpackBundle, {
  globalCSS,
  only,
  publicFolders,
  getRootElement,
}) {
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

  await queued(Object.keys(dom.window.snaps), async (fileName) => {
    const objectOrArray = dom.window.snaps[fileName];
    if (Array.isArray(objectOrArray)) {
      await queued(objectOrArray, async ({ component, variants }) => {
        const processedVariants = await processVariants({
          dom,
          component,
          variants,
          only,
          publicFolders,
          getRootElement,
        });
        result.snapPayloads.push(...processedVariants);
      });
    } else {
      const component = getComponentNameFromFileName(fileName);
      const processedVariants = await processVariants({
        dom,
        component,
        variants: objectOrArray,
        only,
        publicFolders,
        getRootElement,
      });
      result.snapPayloads.push(...processedVariants);
    }
  });

  result.globalCSS = globalCSS + extractCSS(dom);
  dom.window.close();
  return result;
}
