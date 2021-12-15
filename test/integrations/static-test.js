import { execSync } from 'child_process';
import path from 'path';
import http from 'http';

import MockTarget from './MockTarget';
import * as defaultConfig from '../../src/DEFAULTS';
import runCommand from '../../src/commands/run';

const ASSETS_URL_PATTERN = /\/api\/snap-requests\/assets\/(.+)/;

let subject;
let config;
let sha;
let httpServer;

beforeAll(async () => {
  httpServer = http.createServer((req, res) => {
    const match = req.url.match(ASSETS_URL_PATTERN);
    if (match) {
      const hash = match[1];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          path: `staticpkg/${hash}.zip`,
        }),
      );
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          url: 'http://foobar.com',
        }),
      );
    }
  });
  await new Promise((resolve) => httpServer.listen(8990, resolve));
});

afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
});

beforeEach(async () => {
  sha = 'foobar';
  config = Object.assign({}, defaultConfig, {
    apiKey: 'foobar',
    apiSecret: 'barfoo',
    endpoint: 'http://localhost:8990',
    project: 'the project',
    targets: { chrome: new MockTarget() },
    generateStaticPackage: () => ({ path: path.join(__dirname, 'static-files') }),
  });
  subject = () => runCommand(sha, config, {});
});

it('produces the static package', async () => {
  await subject();
  expect(config.targets.chrome.staticPackage).toEqual(
    'staticpkg/716966f385c6d10e661d41f2780eec7e.zip',
  );
});

it('has a consistent hash', async () => {
  await subject();
  expect(config.targets.chrome.staticPackage).toEqual(
    'staticpkg/716966f385c6d10e661d41f2780eec7e.zip',
  );
  delete config.targets.chrome.staticPackage;
  execSync(`touch ${path.join(__dirname, 'static-files', 'iframe.html')}`);
  await subject();
  expect(config.targets.chrome.staticPackage).toEqual(
    'staticpkg/716966f385c6d10e661d41f2780eec7e.zip',
  );
  delete config.targets.chrome.staticPackage;
  await subject();
  expect(config.targets.chrome.staticPackage).toEqual(
    'staticpkg/716966f385c6d10e661d41f2780eec7e.zip',
  );
});
