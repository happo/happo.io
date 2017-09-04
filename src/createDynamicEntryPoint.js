import fs from 'fs';
import os from 'os';
import path from 'path';

import findTestFiles from './findTestFiles';

const TMP_FILE = path.join(os.tmpdir(), 'enduireEntry.js');

export default function createDynamicEntryPoint(userConfig) {
  return findTestFiles().then(files => {
    const strings = [
      (userConfig.setupScript ? `require('${userConfig.setupScript}');` : ''),
      'global.snaps = {};'
    ].concat(
      files.map(file =>
        `global.snaps['${file}'] = require('${path.join(process.cwd(), file)}');`
      ),
    );
    fs.writeFileSync(TMP_FILE, strings.join('\n'));
    return TMP_FILE;
  });
}
