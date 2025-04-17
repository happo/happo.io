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
let deleteOldComments;

beforeEach(() => {
  deleteOldComments = false;
  fetch.mockReset();
  fetch.mockImplementation(() => ({
    ok: true,
    json: () => Promise.resolve([]),
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
      deleteOldComments,
    });
});

it('posts a new comment', async () => {
  await subject();

  const [
    postCommentUrl,
    {
      headers: postCommentHeaders,
      method: postCommentMethod,
      body: postCommentBody,
    },
  ] = fetch.mock.calls[0];
  expect(postCommentUrl).toEqual(
    'https://api.ghe.com/repos/happo/happo-view/issues/156/comments',
  );

  expect(postCommentBody).toEqual(
    '{"body":"<!-- happo-comment -->\\n[![Happo status](https://foo.bar/foo/bar/status.svg)](https://foo.bar/foo/bar)"}',
  );
  expect(postCommentHeaders).toEqual({
    Authorization: 'Bearer baz',
    'User-Agent': 'happo.io client',
  });
  expect(postCommentMethod).toEqual('POST');
});

it('returns true', async () => {
  expect(await subject()).toBe(true);
});

describe('when there are old comments', () => {
  beforeEach(() => {
    deleteOldComments = true;
    fetch.mockImplementation(() => ({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: 1,
            body: 'foo', // should not be deleted
          },
          {
            id: 2,
            body: '<!-- happo-comment --> foo bar', // should be deleted
          },
          {
            id: 3,
            body: 'foo <!-- happo-comment -->', // should not be deleted since the marker is not at the beginning of the line
          },
        ]),
    }));
  });

  it('deletes the ones matching the marker', async () => {
    await subject();
    const [
      deleteCommentUrl,
      { headers: deleteCommentHeaders, method: deleteCommentMethod },
    ] = fetch.mock.calls[1];
    expect(deleteCommentUrl).toEqual(
      'https://api.ghe.com/repos/happo/happo-view/issues/comments/2',
    );
    expect(deleteCommentHeaders).toEqual({
      Authorization: 'Bearer baz',
      'User-Agent': 'happo.io client',
    });
    expect(deleteCommentMethod).toEqual('DELETE');

    const [
      postCommentUrl,
      { headers: postCommentHeaders, method: postCommentMethod },
    ] = fetch.mock.calls[2];
    expect(postCommentUrl).toEqual(
      'https://api.ghe.com/repos/happo/happo-view/issues/156/comments',
    );
    expect(postCommentHeaders).toEqual({
      Authorization: 'Bearer baz',
      'User-Agent': 'happo.io client',
    });
    expect(postCommentMethod).toEqual('POST');
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

describe('when legacy user credentials are provided', () => {
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
