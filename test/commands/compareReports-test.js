import path from 'path';

import { createServer } from 'http-server';

import compareReports from '../../src/commands/compareReports';
import * as defaultConfig from '../../src/DEFAULTS';
import fetchPng from '../../src/fetchPng';
import makeRequest from '../../src/makeRequest';

const realFetchPng = jest.requireActual('../../src/fetchPng').default;

jest.setTimeout(60000);

jest.mock('../../src/makeRequest');
jest.mock('../../src/fetchPng');

let subject;
let config;
let log;
let compareResult;
let cliArgs;

beforeEach(() => {
  log = jest.fn();
  fetchPng.mockImplementation((url, opts) => realFetchPng(url, opts));
  compareResult = {
    summary: 'Mocked summary',
    equal: false,
    diffs: [
      [
        {
          url: 'https://dummyimage.com/200/000/ffffff.png&text=aa',
          component: 'Foo',
          variant: 'bar',
          target: 'chrome',
        },
        {
          url: 'https://dummyimage.com/200/000/f7f7f7.png&text=aa',
          component: 'Foo',
          variant: 'bar',
          target: 'chrome',
        },
      ],
    ],
  };

  cliArgs = {};
  makeRequest.mockReset();
  makeRequest.mockImplementation(() => Promise.resolve(compareResult));
  config = { ...defaultConfig, compareThreshold: 0.00005 };
  subject = () => compareReports('abc', 'xyz', config, cliArgs, log, 2);
});

it('succeeds', async () => {
  const result = await subject();
  expect(result.resolved).toEqual([]);
  expect(log.mock.calls).toEqual([
    ['Found 1 diffs to deep-compare using threshold 0.00005'],
    ['0 out of 1 were below threshold and auto-ignored'],
    ['Mocked summary'],
  ]);
});

describe('when `notify` is set', () => {
  it('sends that param to the happo api', async () => {
    cliArgs.notify = 'foo@bar.com';
    await subject();
    expect(makeRequest.mock.calls.length).toBe(2);
    expect(makeRequest.mock.calls[1][0].body.notify).toEqual('foo@bar.com');
  });
});

describe('when `fallbackShas` is set', () => {
  it('sends that param to the happo api', async () => {
    cliArgs.fallbackShas = 'foo,bar,car';
    await subject();
    expect(makeRequest.mock.calls.length).toBe(2);
    expect(makeRequest.mock.calls[1][0].body.fallbackShas).toEqual([
      'foo',
      'bar',
      'car',
    ]);
  });
});

describe('when fetchPng fails', () => {
  beforeEach(() => {
    fetchPng.mockImplementation(() => Promise.reject(new Error('mocked')));
  });

  it('succeeds', async () => {
    const result = await subject();
    expect(result.resolved).toEqual([]);
    expect(log.mock.calls).toEqual([
      ['Found 1 diffs to deep-compare using threshold 0.00005'],
      ['0 out of 1 were below threshold and auto-ignored'],
      ['Mocked summary'],
    ]);
  });
});

describe('when compareThreshold is missing', () => {
  beforeEach(() => {
    delete config.compareThreshold;
  });

  it('does not deep-compare', async () => {
    const result = await subject();
    expect(result.resolved).toBe(undefined);

    expect(log.mock.calls).toEqual([]);
  });
});

describe('when threshold is larger than the diff', () => {
  beforeEach(() => {
    config.compareThreshold = 0.1;
  });

  it('returns the diff that was deep-compared', async () => {
    const result = await subject();
    expect(result.resolved).toEqual(compareResult.diffs);

    expect(log.mock.calls).toEqual([
      ['Found 1 diffs to deep-compare using threshold 0.1'],
      ['✓ Foo - bar - chrome - diff below threshold, auto-ignoring'],
      ['1 out of 1 were below threshold and auto-ignored'],
      ['Mocked summary'],
    ]);

    // 2 compare calls, 1 ignore call
    expect(makeRequest.mock.calls.length).toBe(3);
  });

  describe('when --dry-run is used', () => {
    beforeEach(() => {
      cliArgs.dryRun = true;
    });

    it('returns the diff that was deep-compared', async () => {
      const result = await subject();
      expect(result.resolved).toEqual(compareResult.diffs);

      expect(log.mock.calls).toEqual([
        ['Found 1 diffs to deep-compare using threshold 0.1'],
        ['Running in --dry-run mode -- no destructive commands will be issued'],
        ['✓ Foo - bar - chrome - diff below threshold, auto-ignoring'],
        ['1 out of 1 were below threshold and auto-ignored'],
        ['Mocked summary'],
      ]);

      // 2 compare calls, 0 ignore call
      expect(makeRequest.mock.calls.length).toBe(2);
    });
  });
});

describe('with a local test server', () => {
  let httpServer;
  beforeEach(async () => {
    httpServer = createServer({
      root: path.join(__dirname, '../assets'),
    });
    await new Promise((resolve) => httpServer.listen(8990, resolve));
  });

  afterEach(() => {
    httpServer.close();
  });

  describe('with giant diffs', () => {
    beforeEach(() => {
      config.compareThreshold = 0.1;
      compareResult.diffs = Array(1000);
      compareResult.diffs.fill([
        {
          url: 'http://localhost:8990/000-fff.png',
          component: 'Foo',
          variant: 'bar',
          target: 'chrome',
        },
        {
          url: 'http://localhost:8990/000-f7f7f7.png',
          component: 'Foo',
          variant: 'bar',
          target: 'chrome',
        },
      ]);
    });

    it('processes all diffs', async () => {
      const result = await subject();
      expect(result.resolved.length).toEqual(1000);
    });
  });

  describe('with the problematic airbnb image', () => {
    beforeEach(() => {
      config.compareThreshold = 1.0;
      compareResult.diffs = [
        [
          {
            url: 'http://localhost:8990/airbnb.png',
            component: 'Foo',
            variant: 'bar',
            target: 'chrome',
          },
          {
            url: 'http://localhost:8990/000-f7f7f7.png',
            component: 'Foo',
            variant: 'bar',
            target: 'chrome',
          },
        ],
      ];
    });

    it('processes all diffs', async () => {
      const result = await subject();
      expect(result.resolved.length).toEqual(1);
    });
  });

  describe('when requests fail with 404', () => {
    beforeEach(() => {
      config.compareThreshold = 0.1;
      compareResult.diffs = [
        [
          {
            url: 'http://localhost:8990/missing-image.png',
            component: 'Foo',
            variant: 'bar',
            target: 'chrome',
          },
          {
            url: 'http://localhost:8990/000-f7f7f7.png',
            component: 'Foo',
            variant: 'bar',
            target: 'chrome',
          },
        ],
      ];
    });

    it('throws a useful error', async () => {
      try {
        await subject();
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toMatch(
          'Failed to fetch PNG at http://localhost:8990/missing-image.png',
        );
        expect(e.message).toMatch('status code: 404');
        expect(e.message).toMatch('The original error was');
        expect(e.message).toMatch('Unexpected end of input');
      }
    });
  });

  describe('when requests fail with wrong binary type', () => {
    beforeEach(() => {
      config.compareThreshold = 0.1;
      compareResult.diffs = [
        [
          {
            url: 'http://localhost:8990/sample.jpg',
            component: 'Foo',
            variant: 'bar',
            target: 'chrome',
          },
          {
            url: 'http://localhost:8990/000-f7f7f7.png',
            component: 'Foo',
            variant: 'bar',
            target: 'chrome',
          },
        ],
      ];
    });

    it('throws a useful error', async () => {
      try {
        await subject();
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toMatch(
          'Failed to fetch PNG at http://localhost:8990/sample.jpg',
        );
        expect(e.message).toMatch('status code: 200');
        expect(e.message).toMatch(/content-length.*51085/);
        expect(e.message).toMatch('(binary content hidden)');
        expect(e.message).toMatch('The original error was');
        expect(e.message).toMatch('Invalid file signature');
      }
    });
  });

  describe('when requests fail with a text response', () => {
    beforeEach(() => {
      config.compareThreshold = 0.1;
      compareResult.diffs = [
        [
          {
            url: 'http://localhost:8990/sample.txt',
            component: 'Foo',
            variant: 'bar',
            target: 'chrome',
          },
          {
            url: 'http://localhost:8990/000-f7f7f7.png',
            component: 'Foo',
            variant: 'bar',
            target: 'chrome',
          },
        ],
      ];
    });

    it('throws a useful error', async () => {
      try {
        await subject();
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toMatch(
          'Failed to fetch PNG at http://localhost:8990/sample.txt',
        );
        expect(e.message).toMatch('status code: 200');
        expect(e.message).toMatch('Sample content');
        expect(e.message).toMatch('The original error was');
        expect(e.message).toMatch('Invalid file signature');
      }
    });
  });
});
