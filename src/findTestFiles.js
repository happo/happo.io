import glob from 'glob';

export default function findTestFiles(pattern) {
  return new Promise((resolve, reject) => {
    glob(
      pattern,
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
