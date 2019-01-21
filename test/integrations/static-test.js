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
  makeRequest.mockImplementation(() => Promise.resolve({}));
  sha = 'foobar';
  config = Object.assign({}, defaultConfig, {
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
    stylesheets: [
      path.resolve(__dirname, 'styles.css'),
    ],
  });
  subject = () => runCommand(sha, config, {});
});

it('sends the project name in the request', async () => {
  await subject();
  expect(makeRequest.mock.calls[0][0].body.project).toEqual('the project');
});

it('produces the static package', async () => {
  await subject();
  expect(config.targets.chrome.staticPackage).toEqual('a base64-encoded string');
});

it('includes css', async () => {
  await subject();
  expect(config.targets.chrome.globalCSS).toEqual('.a { b: c }.foo { color: red }');
});
