import glob from 'glob';

export default function findTestFiles() {
  return new Promise((resolve, reject) => {
    glob(
      '**/@(*-snaps|snaps).@(js|jsx)',
      {
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
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
