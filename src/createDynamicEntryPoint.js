import fs from 'fs';
import os from 'os';
import path from 'path';

import requireRelative from 'require-relative';

import findTestFiles from './findTestFiles';

const TMP_FILE = path.join(
  os.tmpdir(),
  `happo-entry-${Buffer.from(process.cwd()).toString('base64')}.js`,
);

export default function createDynamicEntryPoint({ setupScript, include, only, type }) {
  return findTestFiles(include).then((files) => {
    const filePartOfOnly = only ? only.split('#')[0] : undefined;
    const strings = [
      setupScript ? `require('${setupScript}');` : '',
      'window.snaps = {};',
      `window.happoFlags = { only: ${JSON.stringify(only)} }`,
    ].concat(
      files
        .filter((f) => (filePartOfOnly ? f.includes(filePartOfOnly) : true))
        .map((file) => `window.snaps['${file}'] = require('${path.join(process.cwd(), file)}');`),
    );
    if (type === 'react') {
      const pathToReactDom = requireRelative.resolve('react-dom', process.cwd());
      strings.push(
        `
        const ReactDOM = require('${pathToReactDom}');
        window.happoRender = (component, { rootElement }) => {
          ReactDOM.render(component, rootElement);
        };
      `.trim(),
      );
    } else {
      strings.push('window.happoRender = () => null;');
    }
    strings.push('window.onBundleReady();');
    fs.writeFileSync(TMP_FILE, strings.join('\n'));
    return TMP_FILE;
  });
}
