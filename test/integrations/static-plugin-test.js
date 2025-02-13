import path from 'path';

import AdmZip from 'adm-zip';

import MockTarget from './MockTarget';
import * as defaultConfig from '../../src/DEFAULTS';
import makeRequest from '../../src/makeRequest';
import runCommand from '../../src/commands/run';

jest.mock('../../src/makeRequest');

let subject;
let config;
let sha;

beforeEach(() => {
  makeRequest.mockReset();
  makeRequest.mockImplementation(({ url, method }) => {
    if (/\/assets\//.test(url) && method === 'POST') {
      return Promise.resolve({ path: 'staticpkg/foobar.zip' });
    }
    if (/\/assets-data\//.test(url) && method === 'GET') {
      const e = new Error();
      e.statusCode = 404;
      throw e;
    }
    return Promise.resolve({});
  });
  sha = 'foobar';
  config = {
    ...defaultConfig,
    project: 'the project',
    targets: { chrome: new MockTarget() },
    plugins: [
      {
        generateStaticPackage: () => Promise.reject(new Error('not implemented')),
      },
      {
        css: '.foo { color: red }',
      },
    ],
    stylesheets: [path.resolve(__dirname, 'styles.css')],
  };
  subject = () => runCommand(sha, config, {});
});

describe('when generateStaticPackage resolves to a string', () => {
  beforeEach(() => {
    config.plugins[0].generateStaticPackage = () =>
      Promise.resolve('a base64-encoded string');
  });

  it('sends the project name in the request', async () => {
    await subject();
    expect(makeRequest.mock.calls[2][0].body.project).toEqual('the project');
  });

  it('produces the static package', async () => {
    await subject();
    expect(makeRequest.mock.calls[1][0].formData.payload.value).toEqual(
      Buffer.from('a base64-encoded string', 'base64'),
    );
    expect(config.targets.chrome.staticPackage).toEqual('staticpkg/foobar.zip');
  });

  it('includes css', async () => {
    await subject();
    expect(config.targets.chrome.globalCSS).toEqual(
      '.a {  b: c;}.foo { color: red }',
    );
  });

  it('includes external css', async () => {
    config.stylesheets.push('http://andybrewer.github.io/mvp/mvp.css');
    await subject();
    expect(config.targets.chrome.globalCSS).toMatch(/\.a {\s*b: c;}.*MVP\.css v/);
  });
});

describe('when generateStaticPackage resolves to an object with a path', () => {
  beforeEach(() => {
    config.plugins[0].generateStaticPackage = () =>
      Promise.resolve({ path: path.join(__dirname, 'static-files') });
  });

  it('sends the project name in the request', async () => {
    await subject();
    expect(makeRequest.mock.calls[2][0].body.project).toEqual('the project');
  });

  it('produces the static package', async () => {
    await subject();
    expect(config.targets.chrome.staticPackage).toEqual('staticpkg/foobar.zip');

    const zip = new AdmZip(makeRequest.mock.calls[1][0].formData.payload.value);
    expect(zip.getEntries().map(({ entryName }) => entryName)).toEqual([
      'bundle.js',
      'iframe.html',
    ]);
  });

  it('includes css', async () => {
    await subject();
    expect(config.targets.chrome.globalCSS).toEqual(
      '.a {  b: c;}.foo { color: red }',
    );
  });

  it('includes external css', async () => {
    config.stylesheets.push('http://andybrewer.github.io/mvp/mvp.css');
    await subject();
    expect(config.targets.chrome.globalCSS).toMatch(/\.a {\s*b: c;}.*MVP\.css v/);
  });
});
