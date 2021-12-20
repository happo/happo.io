import fs from 'fs';

import fetch from 'node-fetch';

export default async function loadCSSFile(cssFile) {
  if (cssFile.startsWith('/')) {
    // local file
    return fs.readFileSync(cssFile, 'utf-8');
  }

  const res = await fetch(cssFile);
  if (!res.ok) {
    throw new Error(`Unable to fetch css file: ${cssFile}`);
  }
  return res.text();
}
