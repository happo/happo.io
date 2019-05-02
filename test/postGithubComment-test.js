import request from 'request-promise-native';

import postGithubComment from '../src/postGithubComment';

jest.mock('request-promise-native');

let subject;
let githubApiUrl;
let compareUrl;
let statusImageUrl;
let userCredentials;
let link;

beforeEach(() => {
  request.mockReset();
  githubApiUrl = 'https://api.ghe.com';
  compareUrl = 'https://foo.bar/foo/bar';
  statusImageUrl = 'https://foo.bar/foo/bar/status.svg';
  link = 'https://github.com/happo/happo-view/pull/156';
  userCredentials = 'foo:bar';

  subject = () =>
    postGithubComment({
      link,
      compareUrl,
      statusImageUrl,
      githubApiUrl,
      userCredentials,
    });
});

it('posts a comment', async () => {
  await subject();
  const { auth, body, method, url } = request.mock.calls[0][0];
  expect(url).toEqual(
    'https://api.ghe.com/repos/happo/happo-view/issues/156/comments',
  );
  expect(body.body).toEqual(
    '[![Happo status](https://foo.bar/foo/bar/status.svg)](https://foo.bar/foo/bar)',
  );
  expect(auth).toEqual({ user: 'foo', pass: 'bar' });
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
    const { url } = request.mock.calls[0][0];
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

    expect(request.mock.calls.length).toBe(0);
  });
});
