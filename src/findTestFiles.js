import { glob } from 'glob';

export default async function findTestFiles(pattern) {
  const files = await glob(pattern, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  });

  // Sort the files to make the output deterministic.
  return files.sort((a, b) => a.localeCompare(b));
}
