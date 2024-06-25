/* eslint-disable no-continue */
import WrappedError from '../WrappedError';
import findAssetPaths from '../findAssetPaths';
import getComponentNameFromFileName from '../getComponentNameFromFileName';
import getRenderFunc from './getRenderFunc';
import validateAndFilterExamples from './validateAndFilterExamples';

const ROOT_ELEMENT_ID = 'happo-root';

function findRoot() {
  const { children } = document.body;

  // Find nodes that have some inner content and aren't script nodes.
  const layoutChildren = Array.from(children).filter(
    (node) => node.tagName.toLowerCase() !== 'script' && node.innerHTML !== '',
  );

  if (layoutChildren.length === 0) {
    // None of the children have content. Use the default root element or fall
    // back to the first child.
    return document.getElementById(ROOT_ELEMENT_ID) || children[0];
  }

  if (layoutChildren.length > 1) {
    // When multiple elements have content, use the body as the root (thus
    // forcing all elements to be included in the captured html).
    return document.body;
  }

  // Only one child has content. Use it!
  return layoutChildren[0];
}

async function renderExample(exampleRenderFunc, { component, variant }) {
  document.body.innerHTML = '';
  const rootElement = document.createElement('div');
  rootElement.setAttribute('id', ROOT_ELEMENT_ID);
  rootElement.setAttribute('data-happo-ignore', 'true');
  document.body.appendChild(rootElement);

  const renderInDom = (renderResult) =>
    window.happoRender(renderResult, { rootElement, component, variant });

  const result = exampleRenderFunc(renderInDom);
  if (result && typeof result.then === 'function') {
    // this is a promise
    await result;
    return;
  }
  renderInDom(result);
}

export default class Processor {
  constructor({ only, rootElementSelector, asyncTimeout }) {
    this.asyncTimeout = asyncTimeout;
    this.rootElementSelector = rootElementSelector;
    this.onlyComponent = only ? only.split('#')[1] : undefined;
    // Array containing something like
    // [
    //    {
    //       fileName: '/foo/bar.js',
    //       component: 'Bar',
    //       variants: {
    //         chrome: () => {},
    //         firefox: () => {},
    //       },
    //    },
    //    { fileName: '/bar/car.js', ... etc }
    // ]
    this.flattenedUnfilteredExamples = [];
    this.cursor = -1;
  }

  init({ targetName, only, chunk } = {}) {
    // validate examples before we start rendering
    this.flattenedExamples = validateAndFilterExamples(
      this.flattenedUnfilteredExamples,
      {
        targetName,
        only,
        chunk,
      },
    );
  }

  addExamples(examples) {
    examples.forEach(({ fileName, component, variants }) => {
      Object.keys(variants).forEach((variant) => {
        const render = variants[variant];
        this.flattenedUnfilteredExamples.push({
          fileName,
          component,
          variant,
          render,
        });
      });
    });
  }

  prepare(fileName, exportsFromFile) {
    const keys = Object.keys(exportsFromFile);
    if (keys.includes('default') && Array.isArray(exportsFromFile.default)) {
      // The default export is an array. Treat this as a file which has
      // generated examples.
      exportsFromFile = exportsFromFile.default;
    }
    if (Array.isArray(exportsFromFile)) {
      window.verbose(`Found ${exportsFromFile.length} component(s) in ${fileName}`);
      this.addExamples(exportsFromFile.map((obj) => ({ fileName, ...obj })));
    } else {
      const component = getComponentNameFromFileName(fileName);
      window.verbose(
        `Found ${
          Object.keys(exportsFromFile).length
        } variant(s) for component ${component} in ${fileName}`,
      );

      this.addExamples([{ fileName, component, variants: exportsFromFile }]);
    }
  }

  next() {
    if (!this.flattenedExamples && this.cursor === -1) {
      // TODO: remove this block when happo-plugin-puppeteer has been updated
      // with call to init({ flattenedExamples })
      this.flattenedExamples = validateAndFilterExamples(
        this.flattenedUnfilteredExamples,
        { targetName: undefined },
      );
    }
    this.cursor += 1;
    const item = this.flattenedExamples[this.cursor];
    if (!item) {
      return false;
    }
    if (this.onlyComponent && this.onlyComponent === item.component) {
      return this.next();
    }
    return true;
  }

  async processCurrent() {
    const { component, fileName, variant, render } =
      this.flattenedExamples[this.cursor];
    const exampleRenderFunc = getRenderFunc(render);
    window.happoCleanup();
    try {
      window.verbose(`Rendering component ${component}, variant ${variant}`);
      await renderExample(exampleRenderFunc, { component, variant });
    } catch (e) {
      return new WrappedError(
        `Failed to render component "${component}", variant "${variant}" in ${fileName}`,
        e,
      );
    }
    const root =
      (this.rootElementSelector &&
        document.body.querySelector(this.rootElementSelector)) ||
      findRoot();
    const html = await this.waitForHTML(root);
    const item = {
      html,
      css: '', // Can we remove this?
      component,
      variant,
      assetPaths: findAssetPaths(),
    };
    const { stylesheets } = render;
    if (stylesheets) {
      item.stylesheets = stylesheets;
    }
    return item;
  }

  extractCSS() {
    const styleElements = Array.from(document.querySelectorAll('style'));
    return styleElements
      .map(
        (el) =>
          el.innerHTML ||
          Array.from(el.sheet.cssRules)
            .map((r) => r.cssText)
            .join('\n'),
      )
      .join('\n');
  }

  waitForHTML(elem, start = new Date().getTime(), attempt = 0) {
    const html = elem.innerHTML.trim();
    const duration = new Date().getTime() - start;
    if (html === '' && duration < this.asyncTimeout) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(this.waitForHTML(elem, start, attempt + 1)), 10);
      });
    }
    if (attempt > 0) {
      window.verbose(
        `Content not available on first render. Had to wait ${duration}ms.`,
      );
    }
    return html;
  }
}
