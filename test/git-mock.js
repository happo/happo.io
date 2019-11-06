#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const os = require('os');

const cmd = process.argv[2];

const tmpFile = path.join(os.tmpdir(), 'git-mock-log.txt');
fs.writeFileSync(tmpFile, `${process.argv.slice(2).join(' ')}\n`, { flag: 'a' });

if (cmd === 'rev-parse') {
  const rev = process.argv[3];
  if (rev === 'HEAD') {
    console.log('bar');
  } else {
    // simply echo the sha/identifier
    console.log(rev);
  }
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
