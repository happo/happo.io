import { JSDOM } from 'jsdom';

import WrappedError from './WrappedError';
import createHash from './createHash';
import extractCSS from './extractCSS';
import getComponentNameFromFileName from './getComponentNameFromFileName';
import inlineCSSResources from './inlineCSSResources';
import inlineResources from './inlineResources';
import queued from './queued';

const ROOT_ELEMENT_ID = 'happo-root';

function findRoot(doc) {
  // Grab the element that we add to the dom by default. This element will
  // usually be the right element, at least in the react case.
  const root = doc.getElementById(ROOT_ELEMENT_ID);

  if (!root) {
    // The root element may very well have been overridden in the render method
    // for an example. In that case, fall back to the <body> element.
    return doc.body;
  }

  if (root.innerHTML === '') {
    // The root has no content. Which means we're potentially rendering to a
    // portal element. Iterate through other root elements to see if any other
    // has content.
    for (const potentialRoot of doc.body.children) {
      if (potentialRoot.innerHTML !== '') {
        return potentialRoot;
      }
    }
  }
  return root;
}

async function renderExample(dom, exampleRenderFunc) {
  const doc = dom.window.document;
  doc.body.innerHTML = '';
  const rootElement = doc.createElement('div');
  rootElement.setAttribute('id', ROOT_ELEMENT_ID);
  doc.body.appendChild(rootElement);

  const renderInDom = (renderResult) => dom.window.happoRender(renderResult, { rootElement });

  const result = exampleRenderFunc(renderInDom);
  if (result && typeof result.then === 'function') {
    // this is a promise
    await result;
    return;
  }
  renderInDom(result);
}

async function processVariants({
  fileName,
  dom,
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
    const exampleRenderFunc = variants[variant];
    if (typeof exampleRenderFunc !== 'function') {
      // Some babel loaders add additional properties to the exports.
      // Ignore those that aren't functions.
      return;
    }
    try {
      await renderExample(dom, exampleRenderFunc);
    } catch (e) {
      return new WrappedError(
        `Failed to render component "${component}", variant "${variant}" in ${fileName}`,
        e,
      );
    }

    if (publicFolders && publicFolders.length) {
      inlineResources(dom, { publicFolders });
    }
    const doc = dom.window.document;
    const root = (getRootElement && getRootElement(doc)) || findRoot(doc);
    const html = root.innerHTML.trim();
    dom.window.happoCleanup();
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

export default async function processSnapsInBundle(
  webpackBundle,
  { globalCSS, only, publicFolders, getRootElement, viewport },
) {
  const [width, height] = viewport.split('x').map((s) => parseInt(s, 10));
  const dom = new JSDOM(
    `
      <!DOCTYPE html>
      <html>
        <head>
          <script src='file://${webpackBundle}'></script>
        </head>
        <body>
        </body>
      </html>
    `.trim(),
    {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'http://localhost',
      beforeParse(win) {
        win.outerWidth = win.innerWidth = width;
        win.outerHeight = win.innerHeight = height;
        Object.defineProperties(win.screen, {
          width: { value: width },
          availWidth: { value: width },
          height: { value: height },
          availHeight: { value: height },
        });
        win.requestAnimationFrame = (callback) => setTimeout(callback, 0);
        win.cancelAnimationFrame = () => {};
      },
    },
  );

  await new Promise((resolve) => {
    dom.window.onBundleReady = resolve;
  });

  const result = {
    snapPayloads: [],
  };

  const onlyComponent = only ? only.split('#')[1] : undefined;

  await queued(Object.keys(dom.window.snaps), async (fileName) => {
    let objectOrArray = dom.window.snaps[fileName];
    const keys = Object.keys(objectOrArray);
    if (keys.includes('default') && Array.isArray(objectOrArray.default)) {
      // The default export is an array. Treat this as a file which has
      // generated examples.
      objectOrArray = objectOrArray.default;
    }
    if (Array.isArray(objectOrArray)) {
      await queued(objectOrArray, async ({ component, variants }) => {
        const processedVariants = await processVariants({
          fileName,
          dom,
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
        fileName,
        dom,
        component,
        variants: objectOrArray,
        onlyComponent,
        publicFolders,
        getRootElement,
      });
      result.snapPayloads.push(...processedVariants);
    }
  });

  result.globalCSS = inlineCSSResources(globalCSS + extractCSS(dom), { publicFolders });
  dom.window.close();
  return result;
}
