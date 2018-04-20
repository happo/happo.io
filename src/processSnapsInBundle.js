import fs from 'fs';

import { JSDOM } from 'jsdom';

import createHash from './createHash';
import extractCSS from './extractCSS';
import getComponentNameFromFileName from './getComponentNameFromFileName';
import inlineResources from './inlineResources';
import queued from './queued';

const ROOT_ELEMENT_ID = 'happo-root';

async function renderExample(dom, exampleRenderFunc, render) {
  const doc = dom.window.document;
  doc.body.innerHTML = '';
  const rootElement = doc.createElement('div');
  rootElement.setAttribute('id', ROOT_ELEMENT_ID);
  doc.body.appendChild(rootElement);

  const renderInDom = (renderResult) => {
    render(renderResult, { rootElement, document: doc });
  }

  const result = exampleRenderFunc(renderInDom);
  if (result && typeof result.then === 'function') {
    // this is a promise
    await result;
    return;
  }
  renderInDom(result);
}
async function processVariants({
  dom,
  component,
  variants,
  onlyComponent,
  publicFolders,
  getRootElement,
  render,
}) {
  if (onlyComponent && onlyComponent !== component) {
    return [];
  }
  const result = await queued(Object.keys(variants), async (variant) => {
    const hash = createHash(`${component}|${variant}`);
    const exampleRenderFunc = variants[variant];
    if (typeof exampleRenderFunc !== 'function') {
      // Some babel loaders add additional properties to the exports.
      // Ignore those that aren't functions.
      return;
    }
    await renderExample(dom, exampleRenderFunc, render);

    if (publicFolders && publicFolders.length) {
      inlineResources(dom, { publicFolders });
    }
    const doc = dom.window.document;
    const root = (getRootElement && getRootElement(doc))
      || doc.getElementById(ROOT_ELEMENT_ID) || doc.body;
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
  render,
}) {
  const [ width, height ] = viewport.split('x').map((s) => parseInt(s, 10));
  const dom = new JSDOM(
    '<!DOCTYPE html><head></head><body></body></html>',
    {
      runScripts: 'outside-only',
      beforeParse(win) {
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

  // Parse and execute the webpack bundle in a jsdom environment
  const bundleContent = fs.readFileSync(webpackBundle, { encoding: 'utf-8' });
  dom.window.eval(bundleContent);

  const result = {
    snapPayloads: [],
  };

  const onlyComponent = only ? only.split('#')[1] : undefined;

  await queued(Object.keys(dom.window.snaps), async (fileName) => {
    const objectOrArray = dom.window.snaps[fileName];
    if (Array.isArray(objectOrArray)) {
      await queued(objectOrArray, async ({ component, variants }) => {
        const processedVariants = await processVariants({
          dom,
          component,
          variants,
          onlyComponent,
          publicFolders,
          getRootElement,
          render,
        });
        result.snapPayloads.push(...processedVariants);
      });
    } else {
      const component = getComponentNameFromFileName(fileName);
      const processedVariants = await processVariants({
        dom,
        component,
        variants: objectOrArray,
        onlyComponent,
        publicFolders,
        getRootElement,
        render,
      });
      result.snapPayloads.push(...processedVariants);
    }
  });

  result.globalCSS = globalCSS + extractCSS(dom);
  dom.window.close();
  return result;
}
