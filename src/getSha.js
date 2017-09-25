import fs from 'fs';

import Git from 'nodegit';

import createHash from './createHash';

export default async function getSha() {
  const repo = await Git.Repository.open('.');
  const headCommit = await repo.getHeadCommit();
  const sha = headCommit.sha();
  const status = await repo.getStatus();
  if (!status.length) {
    // No local changes
    return sha;
  }

  // Construct a hash based on the file content of the unstaged files
  const stagedContent = status.map(s => {
    if (s.isDeleted()) {
      return s.path();
    }
    return createHash(fs.readFileSync(s.path()));
  }).join('')
  const statusHash = createHash(stagedContent).slice(0, 10);

  return `${sha.slice(0, 15)}-LOCAL-${statusHash}`;
}
