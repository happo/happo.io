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

  const entries = zip
    .getEntries()
    .map(({ entryName }) => entryName)
    .filter((entryName) => !entryName.includes('.DS_Store'));

  expect(entries).toContain('iframe.html');
  expect(entries).not.toContain('one.jpg');

  expect(entries).toEqual([
    'iframe.html',
    '.happo-alternate-async.js',
    '.happo-alternate.js',
    '000-f7f7f7.png',
    '000-fff.png',
    'airbnb.png',
    'assets/000-f7f7f7.png',
    'assets/000-fff.png',
    'assets/airbnb.png',
    'assets/f7f7f7-aa.png',
    'assets/ffffff-aa.png',
    'assets/sample.jpg',
    'assets/sample.txt',
    'assets/solid-black.png',
    'assets/solid-white-120px-wide.png',
    'assets/solid-white-120px.png',
    'assets/solid-white.png',
    'browser/getRenderFunc-test.js',
    'browser/validateAndFilterExamples-test.js',
    'check-happo-mock.js',
    'cli-mock.js',
    'cli-test.js',
    'commands/compareReports-test.js',
    'compareSnapshots-test.js',
    'createStaticPackage-test.js',
    'deterministicArchive-test.js',
    'f7f7f7-aa.png',
    'fetchPng-test.js',
    'ffffff-aa.png',
    'findAssetPaths-test.js',
    'findCSSAssetPaths-test.js',
    'getComponentNameFromFileName-test.js',
    'git-mock.js',
    'github_pull_request_event.json',
    'github_push_event.json',
    'happo-ci-test.js',
    'inlineResources/1x1.jpg',
    'inlineResources/1x1.png',
    'inlineResources/circle.svg',
    'integrations/assets/one.jpg',
    'integrations/error-test.js',
    'integrations/examples/Bar-react-happo.js',
    'integrations/examples/Button.ffs',
    'integrations/examples/dynamically-imported.js',
    'integrations/examples/Foo-error-empty-happo.js',
    'integrations/examples/Foo-error-generated-happo.js',
    'integrations/examples/Foo-error-happo.js',
    'integrations/examples/Foo-error-misconfigured-happo.js',
    'integrations/examples/Foo-error-syntax-happo.js',
    'integrations/examples/Foo-error-throws-on-render-happo.js',
    'integrations/examples/Foo-plain-happo.js',
    'integrations/examples/Foo-react-happo.js',
    'integrations/examples/Generated-react-happo.js',
    'integrations/examples/InlineCSSVariables-plain-happo.js',
    'integrations/examples/static/1x1.png',
    'integrations/MockTarget.js',
    'integrations/one.css',
    'integrations/plain-test.js',
    'integrations/plugin-examples.js',
    'integrations/react-test.js',
    'integrations/reactSetup.js',
    'integrations/renderWrapper.js',
    'integrations/static-files/bundle.js',
    'integrations/static-files/iframe.html',
    'integrations/static-plugin-test.js',
    'integrations/static-test.js',
    'integrations/styles.css',
    'integrations/theme.js',
    'integrations/two.css',
    'jestSetup.js',
    'loadUserConfig-test.js',
    'Logger-test.js',
    'makeRequest-test.js',
    'mergeJSDOMOptions-test.js',
    'postGithubComment-test.js',
    'prepareAssetsPackage-test.js',
    'RemoteBrowserTarget-test.js',
    'sample.jpg',
    'sample.txt',
    'solid-black.png',
    'solid-white-120px-wide.png',
    'solid-white-120px.png',
    'solid-white.png',
    'validateArchive-test.js',
  ]);
});
