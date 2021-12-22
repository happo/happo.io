import fs from 'fs';
import http from 'http';

import multiparty from 'multiparty';

import makeRequest from '../src/makeRequest';

jest.setTimeout(30000);

let subject;
let props;
let options;
let env;

let httpServer;
let errorTries;

beforeAll(async () => {
  httpServer = http.createServer((req, res) => {
    if (req.url === '/success' || (req.url === '/failure-retry' && errorTries > 2)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          result: 'Hello world!',
        }),
      );
    } else if (req.url === '/form-data') {
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
  await new Promise((resolve) => httpServer.listen(8990, resolve));
});

afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
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
    minTimeout: 0,
    maxTimeout: 1,
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
  options.retryCount = 1;
  await expect(subject()).rejects.toThrow(/connect ECONNREFUSED/);
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

describe('when the request fails twice', () => {
  beforeEach(() => {
    props.url = 'http://localhost:8990/failure-retry';
  });

  it('retries and succeeds', async () => {
    const response = await subject();
    expect(response).toEqual({ result: 'Hello world!' });
  });

  describe('and we do not allow retries', () => {
    beforeEach(() => {
      delete options.retryCount;
    });

    it('throws', async () => {
      await expect(subject()).rejects.toThrow(/Nope/);
    });

    describe('when using maxTries instead of retryCount', () => {
      // legacy, there are clients out there using this name
      //
      beforeEach(() => {
        options.maxTries = 3;
      });

      it('retries and succeeds', async () => {
        const response = await subject();
        expect(response).toEqual({ result: 'Hello world!' });
      });
    });
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
