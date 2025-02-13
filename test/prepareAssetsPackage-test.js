import path from 'path';

import AdmZip from 'adm-zip';

import prepareAssetsPackage from '../src/prepareAssetsPackage';

let subject;
let globalCSS;
let snapPayloads;
let publicFolders;

beforeEach(() => {
  globalCSS = [
    {
      css: `
        .foo { background: url("1x1.jpg") }
        .bar { background: url(one.jpg) }
      `,
      source: path.resolve(__dirname, 'inlineResources/foo.css'),
    },
  ];
  snapPayloads = [{ assetPaths: ['inlineResources/1x1.png'] }];
  publicFolders = [
    __dirname, // absolute path
    'test/integrations/assets', // relative
  ];
  subject = () =>
    prepareAssetsPackage({
      globalCSS,
      snapPayloads,
      publicFolders,
    });
});

it('creates a package when there are assets', async () => {
  const result = await subject();
  expect(result.buffer).not.toBe(undefined);
  expect(result.hash).not.toBe(undefined);
});

it('creates deterministic hashes when content has not changed', async () => {
  expect((await subject()).hash).toEqual((await subject()).hash);
});

it('creates consistent results', async () => {
  const promises = Array.from({ length: 20 }).map(() => subject());
  const results = await Promise.all(promises);
  const hashes = results.map(({ hash }) => hash);

  expect(hashes).toHaveLength(20);
  expect(hashes[0]).not.toBeUndefined();
  expect(typeof hashes[0]).toBe('string');
  expect(hashes[0].length).toBeGreaterThan(0);
  expect(hashes.every((hash) => hash === hashes[0])).toBe(true);
});

it('does not fail when files are missing', async () => {
  const result = await subject();
  publicFolders = [path.join(__dirname, 'foobar')];
  expect(result.buffer).not.toBe(undefined);
  expect(result.hash).not.toBe(undefined);
});

it('picks out the right files', async () => {
  const { buffer } = await subject();
  const zip = new AdmZip(buffer);
  expect(zip.getEntries().map(({ entryName }) => entryName)).toEqual([
    '1x1.jpg', // this is in the root because the css is always served from the root on happo workers
    'inlineResources/1x1.png',
    'one.jpg',
  ]);
});
