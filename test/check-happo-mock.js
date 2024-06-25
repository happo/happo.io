#!/usr/bin/env node

if (process.env.PREVIOUS_SHA === 'no-happo') {
  process.exit(1);
}
