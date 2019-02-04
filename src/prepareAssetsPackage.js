import { Writable } from 'stream';
import fs from 'fs';
import path from 'path';

import Archiver from 'archiver';

import findCSSAssetPaths from './findCSSAssetPaths';

function makePackage({ paths, publicFolders }) {
  return new Promise((resolve, reject) => {
    const archive = new Archiver('zip');

    const stream = new Writable();
    const data = [];

    stream._write = (chunk, enc, done) => { // eslint-disable-line no-underscore-dangle
      data.push(...chunk);
      done();
    };
    stream.on('finish', () => {
      const buffer = Buffer.from(data);
      resolve(buffer);
    });
    archive.pipe(stream);

    paths.forEach((assetPath) => {
      for (const folder of publicFolders) {
        const fullPath = path.join(folder, assetPath);
        if (fs.existsSync(fullPath)) {
          archive.append(fs.createReadStream(fullPath), { name: assetPath });
          return;
        }
      }
    });

    archive.on('error', reject);
    archive.finalize();
  });
}

export default function prepareAssetsPackage({
  globalCSS,
  snapPayloads,
  publicFolders,
}) {
  const paths = new Set();
  globalCSS.forEach(({ css }) => {
    findCSSAssetPaths(css).forEach((cssPath) => {
      paths.add(cssPath);
    });
  });
  snapPayloads.forEach(({ assetPaths }) => {
    assetPaths.forEach((assetPath) => {
      paths.add(assetPath);
    });
  });

  return makePackage({ paths, publicFolders });
}
