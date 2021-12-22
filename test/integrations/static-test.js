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
let mockPkgExists = false;

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
    } else if (/assets-data/.test(req.url)) {
      if (mockPkgExists) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            path: 'staticpkg/mock.zip',
          }),
        );
      } else {
        res.writeHead(404);
        res.end('not found');
      }
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
  mockPkgExists = false;
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
  expect(config.targets.chrome.staticPackage).toMatch(/staticpkg\/[a-z0-9]+\.zip/);
});

it('has a consistent hash', async () => {
  await subject();
  const firstHash = config.targets.chrome.staticPackage;
  expect(firstHash).toMatch(/staticpkg\/[a-z0-9]+\.zip/);
  delete config.targets.chrome.staticPackage;
  execSync(`touch ${path.join(__dirname, 'static-files', 'iframe.html')}`);
  await subject();
  expect(config.targets.chrome.staticPackage).toEqual(firstHash);
  delete config.targets.chrome.staticPackage;
  await subject();
  expect(config.targets.chrome.staticPackage).toEqual(firstHash);
});

describe('when the static package already exists', () => {
  it('does not upload it', async () => {
    mockPkgExists = true;
    await subject();
    expect(config.targets.chrome.staticPackage).toEqual('staticpkg/mock.zip');
  });
});
