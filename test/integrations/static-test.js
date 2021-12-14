import { execSync } from 'child_process';
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
  makeRequest.mockImplementation(() =>
    Promise.resolve({ path: 'staticpkg/foobar.zip' }),
  );
  sha = 'foobar';
  config = Object.assign({}, defaultConfig, {
    project: 'the project',
    targets: { chrome: new MockTarget() },
    generateStaticPackage: () => ({ path: path.join(__dirname, 'static-files') }),
  });
  subject = () => runCommand(sha, config, {});
});

it('sends the project name in the request', async () => {
  await subject();
  expect(makeRequest.mock.calls[1][0].body.project).toEqual('the project');
});

it('produces the static package', async () => {
  await subject();
  expect(makeRequest.mock.calls[0][0].formData.payload.value).toBeTruthy();
  expect(config.targets.chrome.staticPackage).toEqual('staticpkg/foobar.zip');
});

it('has a consistent hash', async () => {
  await subject();
  expect(makeRequest.mock.calls[0][0].url).toEqual('https://happo.io/api/snap-requests/assets/716966f385c6d10e661d41f2780eec7e');
  execSync(`touch ${path.join(__dirname, 'static-files', 'iframe.html')}`);
  expect(makeRequest.mock.calls[0][0].url).toEqual('https://happo.io/api/snap-requests/assets/716966f385c6d10e661d41f2780eec7e');
  await subject();
  expect(makeRequest.mock.calls[0][0].url).toEqual('https://happo.io/api/snap-requests/assets/716966f385c6d10e661d41f2780eec7e');

});
