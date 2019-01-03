/* global window */
/* eslint-disable no-continue */
import WrappedError from '../WrappedError';
import getComponentNameFromFileName from '../getComponentNameFromFileName';

const ROOT_ELEMENT_ID = 'happo-root';

function findRoot() {
  // Grab the element that we add to the dom by default. This element will
  // usually be the right element, at least in the react case.
  const root = document.getElementById(ROOT_ELEMENT_ID);

  if (!root) {
    // The root element may very well have been overridden in the render method
    // for an example. In that case, fall back to the <body> element.
    return document.body;
  }

  if (root.innerHTML === '') {
    // The root has no content. Which means we're potentially rendering to a
    // portal element. Iterate through other root elements to see if any other
    // has content.
    for (const potentialRoot of document.body.children) {
      if (potentialRoot.innerHTML !== '') {
        return potentialRoot;
      }
    }
  }
  return root;
}

async function renderExample(exampleRenderFunc) {
  document.body.innerHTML = '';
  const rootElement = document.createElement('div');
  rootElement.setAttribute('id', ROOT_ELEMENT_ID);
  document.body.appendChild(rootElement);

  const renderInDom = (renderResult) => window.happoRender(renderResult, { rootElement });

  const result = exampleRenderFunc(renderInDom);
  if (result && typeof result.then === 'function') {
    // this is a promise
    await result;
    return;
  }
  renderInDom(result);
}

export default class Processor {
  constructor({ only, rootElementSelector }) {
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
    this.flattenedExamples = [];
    this.cursor = -1;
  }

  prepare(fileName, exportsFromFile) {
    const keys = Object.keys(exportsFromFile);
    if (keys.includes('default') && Array.isArray(exportsFromFile.default)) {
      // The default export is an array. Treat this as a file which has
      // generated examples.
      exportsFromFile = exportsFromFile.default;
    }
    if (Array.isArray(exportsFromFile)) {
      this.flattenedExamples = this.flattenedExamples.concat(
        exportsFromFile.map((obj) => Object.assign({ fileName }, obj)),
      );
    } else {
      const component = getComponentNameFromFileName(fileName);
      this.flattenedExamples.push({ fileName, component, variants: exportsFromFile });
    }
  }

  next() {
    this.cursor += 1;
    const item = this.flattenedExamples[this.cursor];
    if (!item) {
      return undefined;
    }
    if (this.onlyComponent && this.onlyComponent === item.component) {
      return this.next();
    }
    return item;
  }

  async processCurrent() {
    const { component, fileName, variants } = this.flattenedExamples[this.cursor];
    const result = [];
    for (const variant of Object.keys(variants)) {
      const exampleRenderFunc = variants[variant];
      if (typeof exampleRenderFunc !== 'function') {
        // Some babel loaders add additional properties to the exports.
        // Ignore those that aren't functions.
        continue;
      }
      try {
        // Disabling eslint here since we want to run things serially
        // eslint-disable-next-line no-await-in-loop
        await renderExample(exampleRenderFunc);
      } catch (e) {
        result.push(
          new WrappedError(
            `Failed to render component "${component}", variant "${variant}" in ${fileName}`,
            e,
          ),
        );
        continue;
      }
      const root =
        (this.rootElementSelector && document.body.querySelector(this.rootElementSelector)) ||
        findRoot();
      const html = root.innerHTML.trim();
      window.happoCleanup();
      result.push({
        html,
        css: '', // Can we remove this?
        component,
        variant,
      });
    }
    return result.filter(Boolean);
  }

  extractCSS() { // eslint-disable-line class-methods-use-this
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
}
