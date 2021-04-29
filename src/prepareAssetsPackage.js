import { Writable } from 'stream';
import crypto from 'crypto';
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

    // eslint-disable-next-line no-underscore-dangle
    stream._write = (chunk, enc, done) => {
      data.push(...chunk);
      done();
    };
    stream.on('finish', () => {
      const buffer = Buffer.from(data);
      const hash = crypto.createHash('md5').update(buffer).digest('hex');
      resolve({ buffer, hash });
    });
    archive.pipe(stream);

    Object.keys(paths).forEach((assetPath) => {
      const resolvePath = paths[assetPath];

      if (!resolvePath) {
        throw new Error(`Unable to resolve asset path: ${assetPath}`);
      }

      for (const publicFolder of publicFolders) {
        const folder = publicFolder.startsWith('/')
          ? publicFolder
          : path.resolve(process.cwd(), publicFolder);
        const fullPath = path.join(folder, assetPath);
        if (fs.existsSync(fullPath)) {
          archive.append(fs.createReadStream(fullPath), {
            name: resolvePath,
            date: FILE_CREATION_DATE,
          });
          return;
        }
        // findCSSAssetPaths will sometimes return absolute paths
        if (assetPath.startsWith(folder) && fs.existsSync(assetPath)) {
          archive.append(fs.createReadStream(assetPath), {
            name: resolvePath,
            date: FILE_CREATION_DATE,
          });
          return;
        }
        // as a last fallback, check if the resolve path exists in the public folder
        const fullResolvePath = path.join(folder, resolvePath);
        if (fs.existsSync(fullResolvePath)) {
          archive.append(fs.createReadStream(fullResolvePath), {
            name: resolvePath,
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

export default function prepareAssetsPackage({
  globalCSS,
  snapPayloads,
  publicFolders,
}) {
  const paths = {};
  globalCSS.forEach(({ css, source }) => {
    findCSSAssetPaths({ css, source }).forEach(({ assetPath, resolvePath }) => {
      paths[assetPath] = resolvePath;
    });
  });
  snapPayloads.forEach(({ assetPaths }) => {
    assetPaths.forEach((assetPath) => {
      paths[assetPath] = assetPath;
    });
  });

  return makePackage({ paths, publicFolders });
}
