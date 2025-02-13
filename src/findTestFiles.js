import { glob } from 'glob';

export default async function findTestFiles(pattern) {
  const files = await glob(pattern, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  });
  return files;
}
