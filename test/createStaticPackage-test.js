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
  subject = () =>
    createStaticPackage({
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
  expect((await subject()).hash).toEqual((await subject()).hash);
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
