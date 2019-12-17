import { Writable } from 'stream';
import fs from 'fs';

import Archiver from 'archiver';

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

export default function createStaticPackage({ tmpdir, bundleFile, publicFolders }) {
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
      resolve(buffer);
    });
    archive.pipe(stream);

    publicFolders.forEach((folder) => {
      if (folder.startsWith(tmpdir)) {
        archive.directory(tmpdir, false);
      } else if (folder.startsWith(process.cwd())) {
        archive.directory(folder.slice(process.cwd().length + 1));
      }
    });

    archive.append(fs.createReadStream(bundleFile), {
      name: 'happo-bundle.js',
      date: FILE_CREATION_DATE,
    });

    archive.append(IFRAME_CONTENT, {
      name: 'iframe.html',
      date: FILE_CREATION_DATE,
    });


    archive.on('error', reject);
    archive.finalize();
  });
}
