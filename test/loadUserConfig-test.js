import requireRelative from 'require-relative';
import request from 'request-promise-native';

import RemoteBrowserTarget from '../src/RemoteBrowserTarget';
import loadUserConfig from '../src/loadUserConfig';

jest.mock('request-promise-native');
jest.mock('require-relative');

it('yells if api tokens are missing', async () => {
  requireRelative.mockImplementation(() => ({}));
  await expect(loadUserConfig('bogus')).rejects.toThrow(/You need an `apiKey`/);
});

it('yells if targets are missing', async () => {
  requireRelative.mockImplementation(() => ({
    apiKey: '1',
    apiSecret: '2',
    targets: {},
  }));
  await expect(loadUserConfig('bogus')).rejects.toThrow(/You need at least one target/);
});

it('does not yell if all required things are in place', async () => {
  requireRelative.mockImplementation(() => ({
    apiKey: '1',
    apiSecret: '2',
    targets: {
      firefox: new RemoteBrowserTarget('firefox', { viewport: '800x600' }),
    },
  }));
  const config = await loadUserConfig('bogus');
  expect(config.apiKey).toEqual('1');
  expect(config.apiSecret).toEqual('2');
  expect(config.targets).toEqual({
    firefox: new RemoteBrowserTarget('firefox', { viewport: '800x600' }),
  });
});

describe('when CHANGE_URL is defined', () => {
  beforeEach(() => {
    requireRelative.mockImplementation(() => ({
      targets: {
        firefox: new RemoteBrowserTarget('firefox', { viewport: '800x600' }),
      },
    }));
    request.mockImplementation(() => Promise.resolve({ secret: 'yay' }));
  });

  it('grabs a temporary secret', async () => {
    const config = await loadUserConfig('bogus', { CHANGE_URL: 'foo.bar' });
    expect(config.apiKey).toEqual('foo.bar');
    expect(config.apiSecret).toEqual('yay');
  });

  describe('when the API has an error response', () => {
    beforeEach(() => {
      request.mockImplementation(() => Promise.reject(new Error('nope')));
    });

    it('yells', async () => {
      await expect(loadUserConfig('bogus', { CHANGE_URL: 'foo.bar' })).rejects.toThrow(
        /Failed to obtain temporary pull-request token/,
      );
    });
  });
});
