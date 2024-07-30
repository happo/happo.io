import path from 'path';

import AdmZip from 'adm-zip';

import createStaticPackage from '../src/createStaticPackage';

let subject;
let publicFolders;
let tmpdir;

beforeEach(() => {
  publicFolders = [
    __dirname, // absolute path
    'test/integrations/assets', // relative
  ];
  tmpdir = path.resolve(__dirname, 'assets');
  subject = () => createStaticPackage({
      tmpdir,
      publicFolders,
    });
});

it('creates a package', async () => {
  const result = await subject();
  expect(result.buffer).not.toBe(undefined);
  expect(result.hash).not.toBe(undefined);
});

it('creates deterministic hashes when content has not changed', async () => {
  const promises = Array.from({ length: 20 }).map(() => subject());
  const results = await Promise.all(promises);
  const hashes = results.map(({ hash }) => hash);

  expect(hashes).toHaveLength(20);
  expect(hashes[0]).not.toBeUndefined();
  expect(typeof hashes[0]).toBe('string');
  expect(hashes[0].length).toBeGreaterThan(0);
  expect(hashes.every((hash) => hash === hashes[0])).toBe(true);
});

it('picks out the right files', async () => {
  const { buffer } = await subject();
  const zip = new AdmZip(buffer);
  expect(
    zip
      .getEntries()
      .map(({ entryName }) => entryName)
      .includes('solid-white.png'),
  ).toBeTruthy();
});
