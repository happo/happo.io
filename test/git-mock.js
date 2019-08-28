#!/usr/bin/env node

const cmd = process.argv[2];

if (cmd === 'rev-parse') {
  // simply echo the sha/identifier
  console.log(process.argv[3]);
} else if (cmd === 'checkout') {
  // no-op the checkout command
  process.exit(0);
} else if (cmd === 'show') {
  if (process.argv[4] === '--format=%ae') {
    console.log('Tom Dooner <tom@dooner.com>');
  } else {
    console.log('Commit message');
  }
} else {
  console.error('Unknown command:', cmd);
  process.exit(1);
}
