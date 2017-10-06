import requireRelative from 'require-relative';

import RemoteBrowserTarget from '../src/RemoteBrowserTarget';
import loadUserConfig from '../src/loadUserConfig';

jest.mock('require-relative');

it('yells if api tokens are missing', () => {
  requireRelative.mockImplementation(() => ({}));
  expect(() => loadUserConfig('bogus')).toThrowError(
    /You need an `apiKey`/);
});

it('yells if targets are missing', () => {
  requireRelative.mockImplementation(() => ({
    apiKey: '1',
    apiSecret: '2',
    targets: {},
  }));
  expect(() => loadUserConfig('bogus')).toThrowError(
    /You need at least one target/);
});

it('does not yell if all required things are in place', () => {
  requireRelative.mockImplementation(() => ({
    apiKey: '1',
    apiSecret: '2',
    targets: {
      firefox: new RemoteBrowserTarget('firefox', { viewport: '800x600' }),
    },
  }));
  expect(() => loadUserConfig('bogus')).not.toThrowError();
  expect(loadUserConfig('bogus').apiKey).toEqual('1');
  expect(loadUserConfig('bogus').apiSecret).toEqual('2');
  expect(loadUserConfig('bogus').targets).toEqual({
    firefox: new RemoteBrowserTarget('firefox', { viewport: '800x600' }),
  });
});
