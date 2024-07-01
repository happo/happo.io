#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const os = require('os');

const cmd = process.argv.slice(2).join(' ');
const tmpFile = path.join(os.tmpdir(), 'cli-mock-log.txt');

fs.writeFileSync(tmpFile, `${cmd}\n`, { flag: 'a' });

if (/has-report no-report/.test(cmd)) {
  process.exit(1);
}

if (/has-report no-happo/.test(cmd)) {
  process.exit(1);
}

if (/compare no-report bar/.test(cmd)) {
  // exit with the special exit status 113 to signal a diff
  process.exit(113);
}

if (/compare fail bar/.test(cmd)) {
  process.exit(1);
}

if (/--version/.test(cmd)) {
  console.log('v0.0.999');
  process.exit(0);
}
