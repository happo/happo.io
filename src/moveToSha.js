import Git from 'nodegit';

import findRepository from './findRepository';

export default async function moveToSha(sha, { force }) {
  const repo = await findRepository();

  const originalHeadCommit = await repo.getHeadCommit();
  const moveToCommit = await repo.getCommit(sha);

  const status = await repo.getStatus();
  let stashOid;
  if (status.length) {
    // Working tree has changes that aren't commited yet. We need to clean
    // things out before continuing.
    if (!force) {
      throw new Error(
        'Working tree is dirty. Stash your changes before continuing, ' +
        'or use `--force` to have it done automatically'
      );
    }
    stashOid = await Git.Stash.save(
      repo,
      Git.Signature.default(repo),
      'auto-created by happo',
      Git.Stash.FLAGS.INCLUDE_UNTRACKED
    );
    console.log(`Stash saved with oid ${stashOid}.`)
  }
  await Git.Checkout.tree(repo, moveToCommit);

  // Return a cleanup function
  return {
    fullSha: moveToCommit.sha(),
    cleanup: async () => {
      await Git.Checkout.tree(repo, originalHeadCommit);
      if (stashOid) {
        await Git.Stash.pop(repo, 0);
      }
    },
  };
}
