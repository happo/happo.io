import path from 'path';

import prepareAssetsPackage from '../src/prepareAssetsPackage';

let subject;
let globalCSS;
let snapPayloads;
let publicFolders;

beforeEach(() => {
  globalCSS = [{ css: '.foo { background: url(/inlineResources/1x1.png) }' }];
  snapPayloads = [{ assetPaths: ['inlineResources/1x1.png'] }];
  publicFolders = [__dirname];
  subject = () => prepareAssetsPackage({
    globalCSS,
    snapPayloads,
    publicFolders,
  });
});

it('creates a package when there are assets', async () => {
  const result = await subject();
  expect(result).not.toBe(undefined);
});

it('does not fail when files are missing', async () => {
  const result = await subject();
  publicFolders = [path.join(__dirname, 'foobar')];
  expect(result).not.toBe(undefined);
});
