import fs from 'fs';
import os from 'os';
import path from 'path';

import requireRelative from 'require-relative';

import findTestFiles from './findTestFiles';

const TMP_FILE = path.join(os.tmpdir(), 'happoEntry.js');
const pathToReactDom = requireRelative.resolve('react-dom', __dirname);

export default function createDynamicEntryPoint({ setupScript, include }) {
  return findTestFiles(include).then(files => {
    console.log(`Found ${files.length} files.`);
    const strings = [
      `window.ReactDOM = require('${pathToReactDom}');`,
      (setupScript ? `require('${setupScript}');` : ''),
      'window.snaps = {};'
    ].concat(
      files.map(file =>
        `window.snaps['${file}'] = require('${path.join(process.cwd(), file)}');`
      ),
    );
    fs.writeFileSync(TMP_FILE, strings.join('\n'));
    return TMP_FILE;
  });
}
