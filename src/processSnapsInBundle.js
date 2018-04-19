import fs from 'fs';

import jsdomGlobal from 'jsdom-global';

import createHash from './createHash';
import extractCSS from './extractCSS';
import getComponentNameFromFileName from './getComponentNameFromFileName';
import inlineResources from './inlineResources';
import queued from './queued';

const ROOT_ELEMENT_ID = 'happo-root';

async function renderExample(renderMethod) {
  document.body.innerHTML = '';
  const rootElement = document.createElement('div');
  rootElement.setAttribute('id', ROOT_ELEMENT_ID);
  document.body.appendChild(rootElement);

  const renderInDOM = (reactComponent) => {
    if (typeof reactComponent === 'string') {
      throw new Error('Component is a string');
    }
    const ReactDOM = require('react-dom');
    ReactDOM.render(reactComponent, rootElement);
  }

  const result = renderMethod(renderInDOM);
  if (typeof result.then === 'function') {
    // this is a promise
    return await result;
  }
  renderInDOM(result);
}
async function processVariants({
  component,
  variants,
  onlyComponent,
  publicFolders,
  getRootElement,
}) {
  if (onlyComponent && onlyComponent !== component) {
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
    await renderExample(renderFunc);

    if (publicFolders && publicFolders.length) {
      inlineResources({ publicFolders });
    }
    const root = (getRootElement && getRootElement(document))
      || document.getElementById(ROOT_ELEMENT_ID);
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
  viewport,
}) {
  const [ width, height ] = viewport.split('x').map((s) => parseInt(s, 10));
  const cleanupDOM = jsdomGlobal(
    '<!DOCTYPE html><head></head><body></body></html>',
    {
      beforeParse(win) {
        const pxHeight = parseInt()
        win.outerWidth = win.innerWidth = width;
        win.outerHeight = win.innerHeight = height;
        Object.defineProperties(win.screen, {
          width: { value: width },
          availWidth: { value: width },
          height: { value: height },
          availHeight: { value: height },
        });
      },
    }
  );

  // Parse and execute the webpack bundle
  require(webpackBundle);
  const { snaps } = global;

  const result = {
    snapPayloads: [],
  };

  const onlyComponent = only ? only.split('#')[1] : undefined;

  await queued(Object.keys(snaps), async (fileName) => {
    const objectOrArray = snaps[fileName];
    if (Array.isArray(objectOrArray)) {
      await queued(objectOrArray, async ({ component, variants }) => {
        const processedVariants = await processVariants({
          component,
          variants,
          onlyComponent,
          publicFolders,
          getRootElement,
        });
        result.snapPayloads.push(...processedVariants);
      });
    } else {
      const component = getComponentNameFromFileName(fileName);
      const processedVariants = await processVariants({
        component,
        variants: objectOrArray,
        onlyComponent,
        publicFolders,
        getRootElement,
      });
      result.snapPayloads.push(...processedVariants);
    }
  });

  result.globalCSS = globalCSS + extractCSS();
  cleanupDOM();
  return result;
}
