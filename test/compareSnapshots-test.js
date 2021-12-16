import path from 'path';

import { createServer } from 'http-server';

import compareSnapshots from '../src/compareSnapshots';
import fetchPng from '../src/fetchPng';

const realFetchPng = jest.requireActual('../src/fetchPng').default;

jest.mock('../src/fetchPng');

let subject;
let before;
let after;
let compareThreshold;

let httpServer;

beforeAll(async () => {
  httpServer = createServer({
    root: path.join(__dirname, 'assets'),
  });
  await new Promise((resolve) => httpServer.listen(8990, resolve));
});

afterAll(() => {
  httpServer.close();
});

beforeEach(() => {
  fetchPng.mockImplementation(realFetchPng);
  before = {
    url: 'https://happo.io/img/happo-io/93eb2d9e57d43b0b5ca5527587484f18',
    component: 'Foo',
    variant: 'bar',
    target: 'chrome',
    width: 800,
    height: 178,
  };
  after = {
    url: 'https://happo.io/img/happo-io/4a340716fa580b80d9f87330d79903dc',
    component: 'Foo',
    variant: 'bar',
    target: 'chrome',
    width: 800,
    height: 178,
  };
  compareThreshold = 0.2;
  subject = () =>
    compareSnapshots({
      before,
      after,
      endpoint: 'https://happo.io',
      apiKey: 'foo',
      apiSecret: 'bar',
      compareThreshold,
    });
});

it('returns the diff value when diff is above threshold between images', async () => {
  expect(await subject()).toEqual(0.20549884392955664);
});

describe('when images are completely different', () => {
  beforeEach(() => {
    before.url = 'http://localhost:8990/solid-black.png';
    before.width = 90;
    before.height = 90;

    after.url = 'http://localhost:8990/solid-white.png';
    after.width = 90;
    after.height = 90;
  });

  it('returns the diff value', async () => {
    expect(await subject()).toEqual(0.9330436790328738);
  });
});

describe('when images are of different height', () => {
  beforeEach(() => {
    before.url = 'http://localhost:8990/solid-white.png';
    before.width = 90;
    before.height = 90;

    after.url = 'http://localhost:8990/solid-white-120px.png';
    after.width = 90;
    after.height = 120;
  });

  it('returns 1', async () => {
    expect(await subject()).toEqual(1);
  });
});

describe('when images are of different width', () => {
  beforeEach(() => {
    before.url = 'http://localhost:8990/solid-white.png';
    before.width = 90;
    before.height = 90;

    after.url = 'http://localhost:8990/solid-white-120px-wide.png';
    after.width = 120;
    after.height = 90;
  });

  it('returns 1', async () => {
    expect(await subject()).toEqual(1);
  });
});

describe('with a minor diff', () => {
  beforeEach(() => {
    before.url = 'http://localhost:8990/ffffff-aa.png';
    before.width = 200;
    before.height = 200;

    after.url = 'http://localhost:8990/f7f7f7-aa.png';
    after.width = 200;
    after.height = 200;
  });

  it('returns undefined', async () => {
    expect(await subject()).toBe(undefined);
  });

  describe('when the threshold changes', () => {
    beforeEach(() => {
      compareThreshold = 0.0002;
    });

    it('returns the diff value', async () => {
      expect(await subject()).toEqual(0.00022958398868936736);
    });
  });
});

describe('when images are equal', () => {
  beforeEach(() => {
    before.url = 'http://localhost:8990/ffffff-aa.png';
    before.width = 200;
    before.height = 200;

    after.url = 'http://localhost:8990/ffffff-aa.png';
    after.width = 200;
    after.height = 200;
  });

  it('returns undefined', async () => {
    expect(await subject()).toBe(undefined);
  });

  describe('when the threshold is 0', () => {
    beforeEach(() => {
      compareThreshold = 0;
    });

    it('returns undefined', async () => {
      expect(await subject()).toBe(undefined);
    });
  });
});

describe('when fetchPng fails', () => {
  beforeEach(() => {
    let tries = 0;
    fetchPng.mockImplementation((...args) => {
      if (tries > 1) {
        return realFetchPng(...args);
      }
      tries += 1;
      return Promise.reject(new Error('What happened?'));
    });
  });

  it('retries until it passes', async () => {
    expect(await subject()).toEqual(0.20549884392955664);
  });
});
