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
    `let renderWrapper = require('${renderWrapperModule}');`,
    'renderWrapper = renderWrapper.default || renderWrapper;',
  ];
  if (type === 'react') {
    const pathToReactDom = requireRelative.resolve('react-dom', process.cwd());
    strings.push(
      `
      const ReactDOM = require('${pathToReactDom}');
      window.happoRender = (component, { rootElement }) =>
        ReactDOM.render(renderWrapper(component), rootElement);

      window.happoCleanup = () => {
        for (const element of document.body.children) {
          ReactDOM.unmountComponentAtNode(element);
        }
      };
    `.trim(),
    );
  } else {
    strings.push(
      `
      window.happoRender = (html, { rootElement }) => {
        rootElement.innerHTML = renderWrapper(html);
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
  strings.push('window.onBundleReady && window.onBundleReady();');
  const entryFile = path.join(
    tmpdir,
    `happo-entry-${type}-${Buffer.from(process.cwd()).toString('base64')}.js`,
  );

  const content = strings.join('\n');
  if (VERBOSE === 'true') {
    console.log(`Created webpack entry file with the following content:\n\n${content}\n\n`);
  }
  fs.writeFileSync(entryFile, content);
  return { entryFile, numberOfFilesProcessed: fileStrings.length };
}
