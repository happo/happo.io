import Git from 'nodegit';

import path from 'path';

export default async function findRepository(directory = process.cwd()) {
  if (directory === '/') {
    throw new Error('No git repository root found');
  }
  try {
    return await Git.Repository.open(directory);
  } catch (e) {
    return await findRepository(path.dirname(directory));
  }
}
