#!/bin/bash

# Runs a full happo diff
set -euo pipefail

PREVIOUS_SHA="$(git rev-parse "${1-HEAD^}")"
CURRENT_SHA="$(git rev-parse "${1-HEAD}")"

run-happo() {
  SHA=$1
  git checkout --quiet "$SHA"
  yarn install --pure-lockfile
  yarn happo run "$SHA"
}

# Check if we need to generate a baseline
if ! yarn happo has-report "$PREVIOUS_SHA"; then
  echo "No previous report found for ${PREVIOUS_SHA}. Generating one..."
  run-happo "$PREVIOUS_SHA"
fi

run-happo "$CURRENT_SHA"

# Get a summary of the result
SUMMARY=$(npm run --silent happo compare "$PREVIOUS_SHA" "$CURRENT_SHA" || true)

# Post a comment linking to the diff report.
MESSAGE="Message from Happo:

$SUMMARY"

# Post a comment on the commit. I use a node script to do this. It talks to the
# github API and uses a token for auth. It lookssomething like this:
#
# #!/usr/bin/env node
#
# const GithubApi = require('github');
#
# const github = new GithubApi();
# github.authenticate({
#   type: 'token',
#   token: process.env.GHE_TOKEN,
# });
#
# github.repos.createCommitComment({
#   body: process.argv[3],
#   owner: 'enduire',
#   repo: 'happo-view',
#   sha: process.argv[2],
# }, (err) => {
#   if (err) {
#     process.stderr.write(`Error: ${err}\n`);
#     process.exit(1);
#   }
# });
yarn post-comment "$CURRENT_SHA" "$MESSAGE"


