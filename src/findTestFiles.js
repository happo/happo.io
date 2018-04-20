import glob from 'glob';

import { OUTFILE } from './createWebpackBundle';

export default function findTestFiles(pattern) {
  return new Promise((resolve, reject) => {
    glob(
      pattern,
      {
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          OUTFILE,
        ],
      },
      (err, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(files);
      },
    );
  });
}
