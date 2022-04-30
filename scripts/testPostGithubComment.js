const postGithubComment = require('../build/postGithubComment').default;

const githubApiUrl = 'https://api.github.com';

postGithubComment({
  statusImageUrl: 'https://happo.io/favicon',
  link: 'https://github.com/happo/happo-view/pull/641',
  compareUrl: 'https://google.com',
  githubApiUrl,
  userCredentials: process.env.HAPPO_GITHUB_USER_CREDENTIALS,
});
