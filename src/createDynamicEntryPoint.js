import fs from 'fs';
import os from 'os';
import path from 'path';

import requireRelative from 'require-relative';

import findTestFiles from './findTestFiles';

export default async function createDynamicEntryPoint({
  setupScript,
  include,
  only,
  type,
  plugins,
}) {
  const files = await findTestFiles(include);
  const filePartOfOnly = only ? only.split('#')[0] : undefined;
  const fileStrings = files
    .filter((f) => (filePartOfOnly ? f.includes(filePartOfOnly) : true))
    .map((file) => path.join(process.cwd(), file))
    .concat(plugins.map(({ pathToExamplesFile }) => pathToExamplesFile))
    .filter(Boolean)
    .map((file) => `window.snaps['${file}'] = require('${file}');`);

  const strings = [
    setupScript ? `require('${setupScript}');` : '',
    'window.snaps = {};',
    `window.happoFlags = { only: ${JSON.stringify(only)} }`,
  ].concat(fileStrings);
  if (type === 'react') {
    const pathToReactDom = requireRelative.resolve('react-dom', process.cwd());
    strings.push(
      `
      const ReactDOM = require('${pathToReactDom}');
      window.happoRender = (component, { rootElement }) =>
        ReactDOM.render(component, rootElement);
    `.trim(),
    );
  } else {
    strings.push(
      `
      window.happoRender = (html, { rootElement }) => {
        rootElement.innerHTML = html;
        return rootElement;
      };
    `.trim(),
    );
  }
  strings.push('window.onBundleReady();');
  const entryFile = path.join(
    os.tmpdir(),
    `happo-entry-${type}-${Buffer.from(process.cwd()).toString('base64')}.js`,
  );

  fs.writeFileSync(entryFile, strings.join('\n'));
  return { entryFile, numberOfFilesProcessed: fileStrings.length };
}
