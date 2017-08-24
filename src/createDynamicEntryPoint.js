import fs from 'fs';
import os from 'os';
import path from 'path';

import findTestFiles from './findTestFiles';
import resolveTestName from './resolveTestName';

const TMP_FILE = path.join(os.tmpdir(), 'enduireEntry.js');

export default function createDynamicEntryPoint() {
  return findTestFiles().then(files => {
    const strings = files.map(file => {
      const testName = resolveTestName(file);
      return `
        (function () {
          const exported = require('${path.join(process.cwd(), file)}');
          Object.keys(exported).forEach(key => {
            global.snaps['${testName}-' + key] = exported[key];
          });
        })();
      `
    });
    fs.writeFileSync(TMP_FILE, strings.join('\n'));
    return TMP_FILE;
  });
}
