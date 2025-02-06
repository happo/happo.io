import fs from 'fs';
import http from 'http';

import multiparty from 'multiparty';

import makeRequest from '../src/makeRequest';

let subject;
let props;
let options;
let env;

let httpServer;
let errorTries;

// Suppress console.warn logs, so we don't see the retry logs when running these
// tests.
jest.spyOn(console, 'warn').mockImplementation(() => {});

beforeAll(async () => {
  httpServer = http.createServer((req, res) => {
    if (req.url === '/timeout') {
      setTimeout(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            result: 'Hello world!',
          }),
        );
      }, 1000);
      return;
    }

    if (req.url === '/success' || (req.url === '/failure-retry' && errorTries > 2)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          result: 'Hello world!',
        }),
      );
    } else if (
      req.url === '/form-data' ||
      (req.url === '/form-data-failure-retry' && errorTries > 2)
    ) {
      const form = new multiparty.Form();

      form.parse(req, (err, fields, files) => {
        if (err) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end(err.message);
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ fields, files }));
      });
    } else if (req.url === '/body-data') {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ body: JSON.parse(data) }));
      });
    } else {
      errorTries += 1;
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Nope');
    }
  });
  await new Promise((resolve) => {
    httpServer.listen(8990, resolve);
  });
});

afterAll(async () => {
  await new Promise((resolve) => {
    httpServer.close(resolve);
  });
});

beforeEach(() => {
  errorTries = 0;
  props = {
    url: 'http://localhost:8990/success',
    method: 'GET',
  };
  options = {
    apiKey: 'foo',
    apiSecret: 'bar',
    retryCount: 3,
    retryMinTimeout: 0,
    retryMaxTimeout: 1,
  };
  env = undefined;

  subject = () => makeRequest(props, options, env);
});

it('returns the response', async () => {
  const response = await subject();
  expect(response).toEqual({ result: 'Hello world!' });
});

it('can use a proxy', async () => {
  env = { HTTP_PROXY: 'http://localhost:1122' };
  options.retryCount = 0;
  await expect(subject()).rejects.toThrow(/request.*failed/);
});

it('can post json', async () => {
  props.url = 'http://localhost:8990/body-data';
  props.method = 'POST';
  props.body = { foo: 'bar' };
  const response = await subject();
  expect(response).toEqual({ body: { foo: 'bar' } });
});

it('can upload form data with buffers', async () => {
  props.url = 'http://localhost:8990/form-data';
  props.method = 'POST';
  props.formData = {
    type: 'browser-chrome',
    targetName: 'chrome',
    payloadHash: 'foobar',
    payload: {
      options: {
        filename: 'payload.json',
        contentType: 'application/json',
      },
      value: Buffer.from('{"foo": "bar"}'),
    },
  };
  const response = await subject();
  expect(response).toEqual({
    fields: {
      payloadHash: ['foobar'],
      targetName: ['chrome'],
      type: ['browser-chrome'],
    },
    files: {
      payload: [
        {
          fieldName: 'payload',
          headers: {
            'content-disposition':
              'form-data; name="payload"; filename="payload.json"',
            'content-type': 'application/json',
          },
          originalFilename: 'payload.json',
          path: expect.any(String),
          size: 14,
        },
      ],
    },
  });
});

it('can retry uploading form data with buffers', async () => {
  props.url = 'http://localhost:8990/form-data-failure-retry';
  props.method = 'POST';
  props.formData = {
    type: 'browser-chrome',
    targetName: 'chrome',
    payloadHash: 'foobar',
    payload: {
      options: {
        filename: 'payload.json',
        contentType: 'application/json',
      },
      value: Buffer.from('{"foo": "bar"}'),
    },
  };
  const response = await subject();
  expect(response).toEqual({
    fields: {
      payloadHash: ['foobar'],
      targetName: ['chrome'],
      type: ['browser-chrome'],
    },
    files: {
      payload: [
        {
          fieldName: 'payload',
          headers: {
            'content-disposition':
              'form-data; name="payload"; filename="payload.json"',
            'content-type': 'application/json',
          },
          originalFilename: 'payload.json',
          path: expect.any(String),
          size: 14,
        },
      ],
    },
  });
});

it('can upload form data with streams', async () => {
  props.url = 'http://localhost:8990/form-data';
  props.method = 'POST';
  props.formData = {
    payload: {
      options: {
        filename: 'payload.json',
        contentType: 'application/json',
      },
      value: fs.createReadStream('package.json'),
    },
  };
  const response = await subject();
  expect(response).toEqual({
    fields: {},
    files: {
      payload: [
        {
          fieldName: 'payload',
          headers: {
            'content-disposition':
              'form-data; name="payload"; filename="payload.json"',
            'content-type': 'application/json',
          },
          originalFilename: 'payload.json',
          path: expect.any(String),
          size: expect.any(Number),
        },
      ],
    },
  });
});

describe('when the request fails twice and then succeeds', () => {
  beforeEach(() => {
    props.url = 'http://localhost:8990/failure-retry';
  });

  it('retries and succeeds', async () => {
    const response = await subject();
    expect(response).toEqual({ result: 'Hello world!' });
  });

  describe('when retryMinTimeout is not set', () => {
    beforeEach(() => {
      // Setting retryCount to 1 so the test doesn't take a long time
      options.retryCount = 1;
      delete options.retryMinTimeout;
      delete options.retryMaxTimeout;
    });

    it('waits the default amount of time before retrying', async () => {
      const start = Date.now();

      await expect(subject()).rejects.toThrow(/Nope/);

      const duration = Date.now() - start;

      // The default timeout is 1000ms, which is defined by the `retry` package.
      expect(duration).toBeGreaterThan(1000);
    });
  });

  describe('when retryCount is not set', () => {
    beforeEach(() => {
      delete options.retryCount;
    });

    it('throws without retrying', async () => {
      await expect(subject()).rejects.toThrow(/Nope/);
    });
  });

  describe('when retryCount is undefined', () => {
    beforeEach(() => {
      options.retryCount = undefined;
    });

    it('throws without retrying', async () => {
      await expect(subject()).rejects.toThrow(/Nope/);
    });
  });

  describe('when retryCount is 0', () => {
    beforeEach(() => {
      options.retryCount = 0;
    });

    it('throws without retrying', async () => {
      await expect(subject()).rejects.toThrow(/Nope/);
    });
  });
});

describe('can have a timeout', () => {
  it('cancels the request after the allotted time', async () => {
    props.url = 'http://localhost:8990/timeout';
    delete props.method;
    options.timeout = 1;
    options.retryCount = 0;
    await expect(subject()).rejects.toThrow(
      /Timeout when fetching http:\/\/localhost:8990\/timeout using method GET/,
    );
  });
});

describe('when the request fails repeatedly', () => {
  beforeEach(() => {
    props.url = 'http://localhost:8990/failure';
  });

  it('gives up retrying', async () => {
    await expect(subject()).rejects.toThrow(/Nope/);
  });
});
