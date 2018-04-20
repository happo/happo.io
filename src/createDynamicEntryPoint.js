import fs from 'fs';
import os from 'os';
import path from 'path';

import requireRelative from 'require-relative';

import findTestFiles from './findTestFiles';

const TMP_FILE = path.join(os.tmpdir(), 'happoEntry.js');

export default function createDynamicEntryPoint({ setupScript, include, only }) {
  return findTestFiles(include).then(files => {
    const filePartOfOnly = only ? only.split('#')[0] : undefined;
    // console.log(`Found ${files.length} files.`);
    const strings = [
      (setupScript ? `require('${setupScript}');` : ''),
      'window.snaps = {};',
      `window.happoFlags = { only: ${JSON.stringify(only)} }`,
    ].concat(
      files.filter((f) => filePartOfOnly ? f.includes(filePartOfOnly) : true).map(file =>
        `window.snaps['${file}'] = require('${path.join(process.cwd(), file)}');`
      ),
    );
    strings.push('window.onBundleReady();');
    fs.writeFileSync(TMP_FILE, strings.join('\n'));
    return TMP_FILE;
  });
}
