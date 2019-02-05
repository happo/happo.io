import fs from 'fs';

import request from 'request-promise-native';

export default function loadCSSFile(cssFile) {
  if (cssFile.startsWith('/')) {
    // local file
    return fs.readFileSync(cssFile, 'utf-8');
  }

  return request(cssFile);
}
