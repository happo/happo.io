import fetch from 'node-fetch';
import path from 'path';
import requireRelative from 'require-relative';

import Logger from '../src/Logger';
import RemoteBrowserTarget from '../src/RemoteBrowserTarget';
import loadUserConfig from '../src/loadUserConfig';

const actualRequireRelative = jest.requireActual('require-relative');

jest.mock('node-fetch');
jest.mock('require-relative');
jest.mock('../src/Logger');

let warn;
let info;

beforeEach(() => {
  warn = jest.fn();
  info = jest.fn();
  warn.mockReset();
  info.mockReset();
  Logger.mockImplementation(() => ({
    warn,
    info,
  }));
});

it('yells if api tokens are missing', async () => {
  requireRelative.mockImplementation(() => ({}));
  await expect(loadUserConfig('bogus', {})).rejects.toThrow(/You need an `apiKey`/);
});

it('yells if targets are missing', async () => {
  requireRelative.mockImplementation(() => ({
    apiKey: '1',
    apiSecret: '2',
    targets: {},
  }));
  await expect(loadUserConfig('bogus', {})).rejects.toThrow(
    /You need at least one target/,
  );
});

it('does not yell if all required things are in place', async () => {
  requireRelative.mockImplementation(() => ({
    apiKey: '1',
    apiSecret: '2',
    targets: {
      firefox: new RemoteBrowserTarget('firefox', { viewport: '800x600' }),
    },
  }));
  const config = await loadUserConfig('bogus', {});
  expect(config.apiKey).toEqual('1');
  expect(config.apiSecret).toEqual('2');
  expect(config.targets).toEqual({
    firefox: new RemoteBrowserTarget('firefox', { viewport: '800x600' }),
  });
});

describe('when HAPPO_CONFIG_URL is defined', () => {
  beforeEach(() => {
    requireRelative.mockImplementation(actualRequireRelative);
  });

  it('uses config from that file', async () => {
    const config = await loadUserConfig('bogus', {
      HAPPO_CONFIG_FILE: './test/.happo-alternate.js',
    });
    expect(config.apiKey).toEqual('tom');
    expect(config.apiSecret).toEqual('dooner');
  });

  it('allows async config', async () => {
    const config = await loadUserConfig('bogus', {
      HAPPO_CONFIG_FILE: './test/.happo-alternate-async.js',
    });
    expect(config.apiKey).toEqual('tom');
    expect(config.apiSecret).toEqual('dooner');
  });
});

describe('when CHANGE_URL is defined', () => {
  beforeEach(() => {
    requireRelative.mockImplementation(() => ({
      targets: {
        firefox: new RemoteBrowserTarget('firefox', { viewport: '800x600' }),
      },
    }));
    fetch.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => ({ secret: 'yay' }) }),
    );
  });

  it('grabs a temporary secret', async () => {
    const config = await loadUserConfig('bogus', { CHANGE_URL: 'foo.bar' });
    expect(config.apiKey).toEqual('foo.bar');
    expect(config.apiSecret).toEqual('yay');
  });

  it('adds a log', async () => {
    await loadUserConfig('bogus', { CHANGE_URL: 'foo.bar' });
    expect(info.mock.calls[0][0]).toEqual(
      'No `apiKey` or `apiSecret` found in config. Falling back to pull-request authentication.',
    );
  });

  describe('when the API has an error response', () => {
    beforeEach(() => {
      fetch.mockImplementation(() => ({ ok: false, text: () => 'nope' }));
    });

    it('yells', async () => {
      await expect(
        loadUserConfig('bogus', { CHANGE_URL: 'foo.bar' }),
      ).rejects.toThrow(/Failed to obtain temporary pull-request token/);
    });
  });
});

describe('when GITHUB_EVENT_PATH is defined', () => {
  beforeEach(() => {
    requireRelative.mockImplementation(() => ({
      targets: {
        firefox: new RemoteBrowserTarget('firefox', { viewport: '800x600' }),
      },
    }));
    fetch.mockImplementation(() =>
      Promise.resolve({ ok: true, json: () => ({ secret: 'yay' }) }),
    );
  });

  it('grabs a temporary secret', async () => {
    const config = await loadUserConfig('bogus', {
      GITHUB_EVENT_PATH: path.resolve(__dirname, 'github_pull_request_event.json'),
    });
    expect(config.apiKey).toEqual(
      'https://github.com/Codertocat/Hello-World/pull/2',
    );
    expect(config.apiSecret).toEqual('yay');
  });

  describe('when the event is not a PR', () => {
    it('yells', async () => {
      await expect(
        loadUserConfig('bogus', {
          GITHUB_EVENT_PATH: path.resolve(__dirname, 'github_push_event.json'),
        }),
      ).rejects.toThrow(/You need an.*apiSecret/);
    });
  });
});

it('warns when using an unknown config key', async () => {
  requireRelative.mockImplementation(() => ({
    apiKey: '1',
    apiSecret: '2',
    foobar: 'asdf',
    project: 'foobar',
    setupScript: '/path/to/script.js',
    targets: {
      firefox: new RemoteBrowserTarget('firefox', { viewport: '800x600' }),
    },
  }));
  const config = await loadUserConfig('bogus', {});
  expect(config.apiKey).toEqual('1');
  expect(config.apiSecret).toEqual('2');
  expect(warn.mock.calls.length).toBe(1);
  expect(warn.mock.calls[0][0]).toEqual(
    'Unknown config key used in .happo.js: "foobar"',
  );
});
