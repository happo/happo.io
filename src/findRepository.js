import path from 'path';

export default async function findRepository(directory = process.cwd()) {
  if (directory === '/') {
    throw new Error('No git repository root found');
  }
  // we lazy-load nodegit because it has a tendency to fail on some systems, and
  // there are ways to work around that (passing in a sha to `happo run`);
  const Git = require('nodegit');

  try {
    return await Git.Repository.open(directory);
  } catch (e) {
    return await findRepository(path.dirname(directory));
  }
}
