import fs from 'fs';
import path from 'path';

import requireRelative from 'require-relative';

import findTestFiles from './findTestFiles';

const { VERBOSE = 'false' } = process.env;

export default async function createDynamicEntryPoint({
  setupScript,
  include,
  only,
  type,
  plugins,
  prerender,
  tmpdir,
  rootElementSelector,
  renderWrapperModule,
  asyncTimeout,
}) {
  const files = await findTestFiles(include);
  const filePartOfOnly = only ? only.split('#')[0] : undefined;
  const fileStrings = files
    .filter((f) => (filePartOfOnly ? f.includes(filePartOfOnly) : true))
    .map((file) => path.join(process.cwd(), file))
    .concat(plugins.map(({ pathToExamplesFile }) => pathToExamplesFile))
    .filter(Boolean)
    .map((file) => `window.happoProcessor.prepare(${JSON.stringify(file)}, require(${JSON.stringify(file)}));`);

  const pathToProcessor = require.resolve('./browser/processor');
  const strings = [
    `const Processor = require(${JSON.stringify(pathToProcessor)}).default;`,
    `window.happoProcessor = new Processor(${JSON.stringify({ only, rootElementSelector, asyncTimeout })});`,
    `window.verbose = '${VERBOSE}' === 'true' ? console.log : () => null;`,
    'window.snaps = {};',
  ];
  if (type === 'react') {
    const pathToReactDom = requireRelative.resolve('react-dom', process.cwd());
    const pathToRW = renderWrapperModule || require.resolve('./renderWrapperReact');
    strings.push(
      `let renderWrapper = require('${pathToRW}');`,
      'renderWrapper = renderWrapper.default || renderWrapper;',
    );
    strings.push(
      `
      const ReactDOM = require('${pathToReactDom}');
      window.happoRender = (reactComponent, { rootElement, component, variant }) =>
        ReactDOM.render(renderWrapper(reactComponent, { component, variant }), rootElement);

      window.happoCleanup = () => {
        for (const element of document.body.children) {
          ReactDOM.unmountComponentAtNode(element);
        }
      };
    `.trim(),
    );
  } else {
    const pathToRW = renderWrapperModule || require.resolve('./renderWrapper');
    strings.push(
      `let renderWrapper = require('${pathToRW}');`,
      'renderWrapper = renderWrapper.default || renderWrapper;',
    );
    strings.push(
      `
      window.happoRender = (html, { rootElement, component, variant }) => {
        rootElement.innerHTML = renderWrapper(html, { component, variant });
        return rootElement;
      };

      window.happoCleanup = () => {};
    `.trim(),
    );
  }

  if (setupScript) {
    strings.push(`require('${setupScript}');`);
  }
  strings.push(...fileStrings);
  if (!prerender) {
    const pathToRemoteRenderer = require.resolve('./browser/remoteRenderer');
    strings.push(`require('${pathToRemoteRenderer}');`);
  }
  strings.push('window.onBundleReady && window.onBundleReady();');
  const entryFile = path.join(tmpdir, 'happo-entry.js');

  const content = strings.join('\n');
  if (VERBOSE === 'true') {
    console.log(`Created webpack entry file with the following content:\n\n${content}\n\n`);
  }
  fs.writeFileSync(entryFile, content);
  return { entryFile, numberOfFilesProcessed: fileStrings.length };
}
