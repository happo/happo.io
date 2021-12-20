import fetch from 'node-fetch';

import Logger from './Logger';

const REPO_URL_MATCHER = /https?:\/\/[^/]+\/([^/]+)\/([^/]+)\/pull\/([0-9]+)/;
// https://github.com/lightstep/lightstep/pull/6555

const { HAPPO_GITHUB_USER_CREDENTIALS } = process.env;

export default async function postGithubComment({
  statusImageUrl,
  compareUrl,
  link,
  githubApiUrl,
  userCredentials = HAPPO_GITHUB_USER_CREDENTIALS,
}) {
  const matches = link.match(REPO_URL_MATCHER);
  if (!matches) {
    new Logger().info(
      `URL does not look like a github PR URL: ${link}. Skipping github comment posting...`,
    );
    return false;
  }

  const [user, pass] = userCredentials.split(':');

  const owner = matches[1];
  const repo = matches[2];
  const prNumber = matches[3];

  const normalizedGithubApiUrl = githubApiUrl.replace(/\/$/, '');

  const auth = Buffer.from(`${user}:${pass}`).toString('base64');
  const res = await fetch(
    `${normalizedGithubApiUrl}/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    {
      method: 'POST',
      json: true,
      headers: {
        'User-Agent': 'happo.io client',
        Authorization: `Basic ${auth}`,
      },
      body: {
        body: `[![Happo status](${statusImageUrl})](${compareUrl})`,
      },
    },
  );
  if (!res.ok) {
    throw new Error(
      `Failed to post github comment: ${res.status} ${await res.text()}`,
    );
  }
  return true;
}
