import { Writable } from 'stream';
import fs from 'fs';
import path from 'path';

import Archiver from 'archiver';

import findCSSAssetPaths from './findCSSAssetPaths';

// We're setting the creation date to the same for all files so that the zip
// packages created for the same content ends up having the same fingerprint.
const FILE_CREATION_DATE = new Date('Fri Feb 08 2019 13:31:55 GMT+0100 (CET)');

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
          archive.append(fs.createReadStream(fullPath), {
            name: assetPath,
            date: FILE_CREATION_DATE,
          });
          return;
        }
      }
    });

    archive.on('error', reject);
    archive.finalize();
  });
}

export default function prepareAssetsPackage({ globalCSS, snapPayloads, publicFolders }) {
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
