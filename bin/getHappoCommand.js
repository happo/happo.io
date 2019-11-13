#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const { scripts } = require('../package.json');

if (scripts.happo) {
  if (fs.existsSync(path.resolve(__dirname, '../yarn.locsk'))) {
    console.log('yarn run happo');
  } else {
    console.log('npm run happo');
  }
} else {
  console.log('node_modules/happo.io/build/cli.js');
}
