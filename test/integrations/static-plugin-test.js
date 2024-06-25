import path from 'path';

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
        generateStaticPackage: () => Promise.resolve('a base64-encoded string'),
      },
      {
        css: '.foo { color: red }',
      },
    ],
    stylesheets: [path.resolve(__dirname, 'styles.css')],
  };
  subject = () => runCommand(sha, config, {});
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
  expect(config.targets.chrome.globalCSS).toEqual('.a {  b: c;}.foo { color: red }');
});

it('includes external css', async () => {
  config.stylesheets.push('http://andybrewer.github.io/mvp/mvp.css');
  await subject();
  expect(config.targets.chrome.globalCSS).toMatch(/\.a {\s*b: c;}.*MVP\.css v/);
});
