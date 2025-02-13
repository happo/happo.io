import path from 'path';

import AdmZip from 'adm-zip';

import deterministicArchive from '../src/deterministicArchive';

const publicFolders = [
  __dirname, // absolute path
  'test/integrations/assets', // relative
];

const tmpdir = path.resolve(__dirname, 'assets');

it('creates a package', async () => {
  const result = await deterministicArchive([tmpdir, ...publicFolders]);

  expect(result.buffer).not.toBe(undefined);
  expect(result.hash).not.toBe(undefined);
});

it('creates deterministic hashes when content has not changed', async () => {
  const promises = Array.from({ length: 20 }).map(() =>
    deterministicArchive([tmpdir, ...publicFolders]),
  );
  const results = await Promise.all(promises);
  const hashes = results.map(({ hash }) => hash);

  expect(hashes).toHaveLength(20);
  expect(hashes[0]).not.toBeUndefined();
  expect(typeof hashes[0]).toBe('string');
  expect(hashes[0].length).toBeGreaterThan(0);
  expect(hashes.every((hash) => hash === hashes[0])).toBe(true);
});

it('picks out the right files', async () => {
  const { buffer } = await deterministicArchive([tmpdir, ...publicFolders]);

  const zip = new AdmZip(buffer);
  expect(
    zip
      .getEntries()
      .map(({ entryName }) => entryName)
      .includes('solid-white.png'),
  ).toBeTruthy();
});

it('does not include duplicate files', async () => {
  const resultNormal = await deterministicArchive([tmpdir, ...publicFolders]);
  const resultWithPossibleDuplicates = await deterministicArchive([
    tmpdir,
    tmpdir,
    ...publicFolders,
    ...publicFolders,
  ]);
  expect(resultNormal.hash).toEqual(resultWithPossibleDuplicates.hash);
  expect(resultNormal.buffer).toEqual(resultWithPossibleDuplicates.buffer);

  const zip = new AdmZip(resultWithPossibleDuplicates.buffer);
  const entries = zip
    .getEntries()
    .map(({ entryName }) => entryName)
    // This file is gitignored, so we want to filter it out to make local and CI
    // runs consistent.
    .filter((entryName) => !entryName.includes('.DS_Store'));

  expect(entries).toHaveLength(84);
});

it('can include in-memory content', async () => {
  const content = 'hi friends';
  const result = await deterministicArchive(
    [tmpdir, ...publicFolders],
    [{ name: 'my-in-memory-file.txt', content }],
  );

  const zip = new AdmZip(result.buffer);
  const myFile = zip.getEntry('my-in-memory-file.txt');
  expect(myFile.getData().toString()).toBe(content);
});

it('handles relative paths', async () => {
  const result = await deterministicArchive(['test/integrations/assets']);
  const zip = new AdmZip(result.buffer);

  const entries = zip
    .getEntries()
    .map(({ entryName }) => entryName)
    // This file is gitignored, so we want to filter it out to make local and CI
    // runs consistent.
    .filter((entryName) => !entryName.includes('.DS_Store'));

  expect(entries).toEqual(['one.jpg']);
});
