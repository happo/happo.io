import fetch from 'node-fetch';

import Logger from './Logger';

const REPO_URL_MATCHER = /https?:\/\/[^/]+\/([^/]+)\/([^/]+)\/pull\/([0-9]+)/;
// https://github.com/lightstep/lightstep/pull/6555

const { HAPPO_GITHUB_USER_CREDENTIALS, HAPPO_GITHUB_TOKEN } = process.env;

export default async function postGithubComment({
  statusImageUrl,
  compareUrl,
  link,
  githubApiUrl,
  legacyUserCredentials = HAPPO_GITHUB_USER_CREDENTIALS,
  authToken = HAPPO_GITHUB_TOKEN,
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
    const [user, pass] = legacyUserCredentials.split(':');
    authHeader = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  } else {
    throw new Error(
      'Either HAPPO_GITHUB_TOKEN or HAPPO_GITHUB_USER_CREDENTIALS must be provided',
    );
  }

  const body = `[![Happo status](${statusImageUrl})](${compareUrl})`;
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
