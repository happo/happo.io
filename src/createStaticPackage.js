import { Writable } from 'stream';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

import Archiver from 'archiver';

import validateArchive from './validateArchive';

// We're setting the creation date to the same for all files so that the zip
// packages created for the same content ends up having the same fingerprint.
const FILE_CREATION_DATE = new Date('Fri Feb 08 2019 13:31:55 GMT+0100 (CET)');

const IFRAME_CONTENT = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <script src="happo-bundle.js"></script>
  </body>
</html>
`;

/**
 * Gets all files in a directory and all of its subdirectories
 *
 * The returned value is sorted for deterministic output.
 *
 * @param {string} dir
 * @returns {Array<string>}
 */
function getFilesRecursive(dir) {
  const files = [];
  const dirs = [dir];

  while (dirs.length > 0) {
    const currentDir = dirs.shift();
    // Node 18 adds `recursive` option to `fs.readdirSync`, which would
    // make this function simpler.
    const dirents = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const dirent of dirents) {
      const res = path.resolve(currentDir, dirent.name);

      if (dirent.isDirectory()) {
        // This is a directory, so we are going to add it to the list of directories to recurse into.
        dirs.push(res);
        files.push(res);
      } else {
        files.push(res);
      }
    }
  }

  // Sort the files for deterministic output. This is important so that
  // the archive hash is the same.
  files.sort((a, b) => a.localeCompare(b));
  return files;
}

export default function createStaticPackage({ tmpdir, publicFolders }) {
  return new Promise((resolve, reject) => {
    const archive = new Archiver('zip', {
      // Concurrency in the stat queue leads to non-deterministic output.
      // https://github.com/archiverjs/node-archiver/issues/383#issuecomment-2253139948
      statConcurrency: 1,
      zlib: { level: 6 },
    });

    const stream = new Writable();
    const data = [];

    stream._write = (chunk, _enc, done) => {
      data.push(...chunk);
      done();
    };

    const entries = [];
    archive.on('entry', (entry) => {
      entries.push(entry);
    });

    stream.on('finish', () => {
      validateArchive(archive.pointer(), entries);
      const buffer = Buffer.from(data);
      const hash = crypto.createHash('md5').update(buffer).digest('hex');

      resolve({ buffer, hash });
    });
    archive.pipe(stream);

    // We can't use archive.directory() here because it is not deterministic.
    // https://github.com/archiverjs/node-archiver/issues/383#issuecomment-2252938075
    const tmpdirFiles = getFilesRecursive(tmpdir);
    for (const file of tmpdirFiles) {
      archive.file(file, {
        name: file.slice(tmpdir.length + 1),
        prefix: '',
        date: FILE_CREATION_DATE,
      });
    }

    publicFolders.forEach((folder) => {
      if (folder === tmpdir) {
        // ignore, since this is handled separately
      } else if (folder.startsWith(process.cwd())) {
        const folderFiles = getFilesRecursive(folder);
        for (const file of folderFiles) {
          archive.file(file, {
            name: file.slice(folder.length + 1),
            prefix: '',
            date: FILE_CREATION_DATE,
          });
        }
      }
    });

    archive.append(IFRAME_CONTENT, {
      name: 'iframe.html',
      date: FILE_CREATION_DATE,
    });

    archive.on('error', reject);
    archive.finalize();
  });
}

export { FILE_CREATION_DATE };
