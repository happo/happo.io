import fetchPng from '../src/fetchPng';
import { PNG } from 'pngjs';

let subject;
let url;

beforeEach(() => {
  // Create a 64x64 PNG buffer
  const png = new PNG({ width: 64, height: 64 });
  // Fill with some test data
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 255; // red
    png.data[i + 1] = 0; // green
    png.data[i + 2] = 0; // blue
    png.data[i + 3] = 255; // alpha
  }
  const pngBuffer = PNG.sync.write(png);

  jest.spyOn(global, 'fetch').mockImplementation(() => ({
    ok: true,
    headers: {
      get: () => 'image/png',
    },
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(pngBuffer);
        controller.close();
      },
    }),
  }));

  url = 'https://happo.io/static/github-logo.png';
  subject = () =>
    fetchPng(url, {
      apiKey: 'foo',
      apiSecret: 'bar',
      endpoint: 'https://happo.io',
    });
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('resolves with a bitmap', async () => {
  const bitmap = await subject();
  expect(bitmap.width).toBe(64);
  expect(bitmap.height).toBe(64);
  expect(bitmap.data.length).toBe(16384);
});

it('does not send credentials for external urls', async () => {
  url =
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/272px-Google_2015_logo.svg.png';
  await subject();
  expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe(undefined);
});

it('sends credentials for happo urls', async () => {
  url = 'https://happo.io/a/120/img/happo-io/5ed1580f2dc7243b92c9ff648bbd1824';
  await subject();
  expect(global.fetch.mock.calls[0][1].headers.Authorization).toMatch(
    /Bearer [a-z0-9]+/,
  );
});

describe('with an invalid url', () => {
  beforeEach(() => {
    url = 'asdfasdf';
  });

  it('rejects', async () => {
    expect.assertions = 1;
    try {
      await subject();
    } catch (e) {
      expect(e.message).toMatch('Only absolute URLs are supported');
    }
  });
});

describe('with a url that is not an image', () => {
  beforeEach(() => {
    url = 'https://google.se/';

    fetch.mockImplementation(() => ({
      ok: true,
      headers: {
        get: () => 'text/html',
      },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue('asdf');
          controller.close();
        },
      }),
    }));
  });

  it('rejects', async () => {
    await expect(subject()).rejects.toThrow(
      /Failed to fetch PNG at.*wrong content type/,
    );
  });
});
