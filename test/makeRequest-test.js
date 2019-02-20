import request from 'request-promise-native';

import makeRequest from '../src/makeRequest';

jest.mock('request-promise-native');

let subject;
let props;
let secrets;

beforeEach(() => {
  request.mockImplementation(async () => 'Hello world!');
  props = {
    url: 'https://happo.io',
    method: 'GET',
  };
  secrets = {
    apiKey: 'foo',
    apiSecret: 'bar',
  };
  subject = () => makeRequest(props, secrets);
});

it('returns the response', async () => {
  const response = await subject();
  expect(response).toEqual('Hello world!');
});

describe('when the request fails twice', () => {
  beforeEach(() => {
    props.url = 'http://sometimes-throws';
    let tries = 0;
    request.mockImplementation(async () => {
      tries += 1;
      if (tries < 3) {
        throw new Error('Nope');
      }
      return 'Foo bar';
    });
  });

  it('retries and succeeds', async () => {
    const response = await subject();
    expect(response).toEqual('Foo bar');
  });
});

describe('when the request fails repeatedly', () => {
  beforeEach(() => {
    props.url = 'http://always-throws';
    request.mockImplementation(async () => {
      throw new Error('Nope');
    });
  });

  it('gives up retrying', async () => {
    await expect(subject()).rejects.toThrow(/Nope/);
  });
});
