import fs from 'fs';
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

it('creates consistent results', async () => {
  const first = await subject();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const filename = path.resolve(__dirname, 'inlineResources/1x1.png');
  fs.utimesSync(filename, new Date(), new Date());
  const second = await subject();
  expect(first).toEqual(second);
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
    'one.jpg',
    'inlineResources/1x1.png',
  ]);
});
