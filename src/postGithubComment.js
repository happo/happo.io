import fetch from 'node-fetch';

import Logger from './Logger';

const REPO_URL_MATCHER = /https?:\/\/[^/]+\/([^/]+)\/([^/]+)\/pull\/([0-9]+)/;
// https://github.com/lightstep/lightstep/pull/6555

const {
  HAPPO_GITHUB_USER_CREDENTIALS,
  HAPPO_GITHUB_TOKEN,
  HAPPO_DELETE_OLD_COMMENTS,
} = process.env;

const HAPPO_COMMENT_MARKER = '<!-- happo-comment -->';

async function deleteExistingComments({
  normalizedGithubApiUrl,
  owner,
  repo,
  prNumber,
  authHeader,
}) {
  const commentsRes = await fetch(
    `${normalizedGithubApiUrl}/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    {
      headers: {
        'User-Agent': 'happo.io client',
        Authorization: authHeader,
      },
      method: 'GET',
    },
  );

  if (!commentsRes.ok) {
    throw new Error(
      `Failed to fetch existing comments: ${commentsRes.status} ${await commentsRes.text()}`,
    );
  }

  const comments = await commentsRes.json();
  const happoComments = comments.filter((comment) =>
    comment.body.startsWith(HAPPO_COMMENT_MARKER),
  );

  await Promise.all(
    happoComments.map((comment) =>
      fetch(
        `${normalizedGithubApiUrl}/repos/${owner}/${repo}/issues/${prNumber}/comments/${comment.id}`,
        {
          method: 'DELETE',
          headers: {
            'User-Agent': 'happo.io client',
            Authorization: authHeader,
          },
        },
      ),
    ),
  );
}

export default async function postGithubComment({
  statusImageUrl,
  compareUrl,
  link,
  githubApiUrl,
  legacyUserCredentials = HAPPO_GITHUB_USER_CREDENTIALS,
  authToken = HAPPO_GITHUB_TOKEN,
  deleteOldComments = HAPPO_DELETE_OLD_COMMENTS === 'true',
}) {
  const matches = link.match(REPO_URL_MATCHER);
  if (!matches) {
    new Logger().info(
      `URL does not look like a github PR URL: ${link}. Skipping github comment posting...`,
    );
    return false;
  }

  const owner = matches[1];
  const repo = matches[2];
  const prNumber = matches[3];

  const normalizedGithubApiUrl = githubApiUrl.replace(/\/$/, '');

  let authHeader;
  if (authToken) {
    authHeader = `Bearer ${authToken}`;
  } else if (legacyUserCredentials) {
    new Logger().warn(
      'HAPPO_GITHUB_USER_CREDENTIALS is deprecated and will be removed in a future version. Use HAPPO_GITHUB_TOKEN instead.',
    );
    const [user, pass] = legacyUserCredentials.split(':');
    authHeader = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  } else {
    throw new Error(
      'Either HAPPO_GITHUB_TOKEN or HAPPO_GITHUB_USER_CREDENTIALS must be provided',
    );
  }

  if (deleteOldComments) {
    await deleteExistingComments({
      normalizedGithubApiUrl,
      owner,
      repo,
      prNumber,
      authHeader,
    });
  }

  const body = `${HAPPO_COMMENT_MARKER}\n[![Happo status](${statusImageUrl})](${compareUrl})`;
  const res = await fetch(
    `${normalizedGithubApiUrl}/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    {
      method: 'POST',
      json: true,
      headers: {
        'User-Agent': 'happo.io client',
        Authorization: authHeader,
      },
      body: JSON.stringify({ body }),
    },
  );
  if (!res.ok) {
    throw new Error(
      `Failed to post github comment: ${res.status} ${await res.text()}`,
    );
  }

  return true;
}
