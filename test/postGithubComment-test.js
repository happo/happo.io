import fetch from 'node-fetch';

import postGithubComment from '../src/postGithubComment';

jest.mock('node-fetch');

let subject;
let githubApiUrl;
let compareUrl;
let statusImageUrl;
let legacyUserCredentials;
let authToken;
let link;

beforeEach(() => {
  fetch.mockReset();
  fetch.mockImplementation(() => ({
    ok: true,
  }));
  githubApiUrl = 'https://api.ghe.com';
  compareUrl = 'https://foo.bar/foo/bar';
  statusImageUrl = 'https://foo.bar/foo/bar/status.svg';
  link = 'https://github.com/happo/happo-view/pull/156';
  authToken = 'baz';

  subject = () =>
    postGithubComment({
      link,
      compareUrl,
      statusImageUrl,
      githubApiUrl,
      legacyUserCredentials,
      authToken,
    });
});

it('posts a comment', async () => {
  await subject();
  const url = fetch.mock.calls[0][0];
  const { headers, body, method } = fetch.mock.calls[0][1];
  expect(url).toEqual(
    'https://api.ghe.com/repos/happo/happo-view/issues/156/comments',
  );
  expect(body).toEqual(
    JSON.stringify({
      body: '[![Happo status](https://foo.bar/foo/bar/status.svg)](https://foo.bar/foo/bar)',
    }),
  );
  expect(headers).toEqual({
    Authorization: 'Bearer baz',
    'User-Agent': 'happo.io client',
  });
  expect(method).toEqual('POST');
});

it('returns true', async () => {
  expect(await subject()).toBe(true);
});

describe('when githubApiUrl ends with a slash', () => {
  beforeEach(() => {
    githubApiUrl = 'https://ghe.com/api/v3/';
  });

  it('constructs a correct URL', async () => {
    await subject();
    const url = fetch.mock.calls[0][0];
    expect(url).toEqual(
      'https://ghe.com/api/v3/repos/happo/happo-view/issues/156/comments',
    );
  });
});

describe('when the link does not match a PR url', () => {
  beforeEach(() => {
    link = 'https://github.com/happo/happo-view/issues/156';
  });

  it('does not post anything', async () => {
    const result = await subject();
    expect(result).toBe(false);

    expect(fetch.mock.calls.length).toBe(0);
  });
});

describe('when no auth token is provided', () => {
  beforeEach(() => {
    authToken = undefined;
  });

  it('throws an error', async () => {
    await expect(subject()).rejects.toThrow(
      'Either HAPPO_GITHUB_TOKEN or HAPPO_GITHUB_USER_CREDENTIALS must be provided',
    );
  });
});

describe('when a legacy user credentials are provided', () => {
  beforeEach(() => {
    legacyUserCredentials = 'foo:bar';
  });

  it('prefers the auth token', async () => {
    await subject();
    const url = fetch.mock.calls[0][0];
    const { headers, method } = fetch.mock.calls[0][1];
    expect(url).toEqual(
      'https://api.ghe.com/repos/happo/happo-view/issues/156/comments',
    );
    expect(headers).toEqual({
      Authorization: 'Bearer baz',
      'User-Agent': 'happo.io client',
    });
    expect(method).toEqual('POST');
  });

  describe('when no auth token is provided', () => {
    beforeEach(() => {
      authToken = undefined;
    });

    it('uses the legacy user credentials', async () => {
      await subject();
      const url = fetch.mock.calls[0][0];
      const { headers, method } = fetch.mock.calls[0][1];
      expect(url).toEqual(
        'https://api.ghe.com/repos/happo/happo-view/issues/156/comments',
      );
      expect(headers).toEqual({
        Authorization: 'Basic Zm9vOmJhcg==',
        'User-Agent': 'happo.io client',
      });
      expect(method).toEqual('POST');
    });
  });
});
