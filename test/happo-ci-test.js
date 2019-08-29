import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const cliLogFile = path.join(os.tmpdir(), 'cli-mock-log.txt');
const gitLogFile = path.join(os.tmpdir(), 'git-mock-log.txt');

let subject;
let env;

function getLog(file) {
  try {
    return fs
      .readFileSync(file, 'utf-8')
      .split('\n')
      .filter(Boolean);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return [];
    }
    throw e;
  }
}
const getCliLog = getLog.bind(undefined, cliLogFile);
const getGitLog = getLog.bind(undefined, gitLogFile);

beforeEach(() => {
  env = {
    ...process.env,
    HAPPO_COMMAND: './test/cli-mock.js',
    INSTALL_CMD: 'echo "install"',
    PREVIOUS_SHA: 'foo',
    CURRENT_SHA: 'bar',
    CHANGE_URL: 'http://foo.bar/',
    HAPPO_GIT_COMMAND: './test/git-mock.js',
    HAPPO_CHECK: './test/check-happo-mock.js',
  };
  if (fs.existsSync(cliLogFile)) {
    fs.unlinkSync(cliLogFile);
  }
  if (fs.existsSync(gitLogFile)) {
    fs.unlinkSync(gitLogFile);
  }
  subject = () => {
    execSync('./bin/happo-ci', {
      env,
    });
  };
});

describe('when PREVIOUS_SHA is missing', () => {
  beforeEach(() => {
    delete env.PREVIOUS_SHA;
  });

  it('fails with a message', () => {
    expect(subject).toThrow(/PREVIOUS_SHA: unbound variable/);
  });
});

describe('when CURRENT_SHA is missing', () => {
  beforeEach(() => {
    delete env.CURRENT_SHA;
  });

  it('fails with a message', () => {
    expect(subject).toThrow(/CURRENT_SHA: unbound variable/);
  });
});

describe('when CHANGE_URL is missing', () => {
  beforeEach(() => {
    delete env.CHANGE_URL;
  });

  it('fails with a message', () => {
    expect(subject).toThrow(/CHANGE_URL: unbound variable/);
  });
});

describe('when CURRENT_SHA and PREVIOUS_SHA is the same', () => {
  beforeEach(() => {
    env.PREVIOUS_SHA = env.CURRENT_SHA;
  });

  it('runs a single report', () => {
    subject();
    expect(getCliLog()).toEqual([
      'run bar --link http://foo.bar/ --message Commit message',
    ]);
    expect(getGitLog()).toEqual([
      'rev-parse bar',
      'rev-parse bar',
      'checkout --force --quiet bar',
      'show -s --format=%s',
    ]);
  });
});

describe('when there is a report for PREVIOUS_SHA', () => {
  it('runs the right happo commands', () => {
    subject();
    expect(getCliLog()).toEqual([
      'start-job foo bar',
      'run bar --link http://foo.bar/ --message Commit message',
      'has-report foo',
      'compare foo bar --link http://foo.bar/ --message Commit message --author Tom Dooner <tom@dooner.com>',
    ]);
    expect(getGitLog()).toEqual([
      'rev-parse foo',
      'rev-parse bar',
      'checkout --force --quiet bar',
      'show -s --format=%s',
      'show -s --format=%s',
      'show -s --format=%ae',
      'checkout --force --quiet bar',
    ]);
  });
});

describe('when there is no report for PREVIOUS_SHA', () => {
  beforeEach(() => {
    env.PREVIOUS_SHA = 'no-report';
  });

  it('runs the right happo commands', () => {
    subject();
    expect(getCliLog()).toEqual([
      'start-job no-report bar',
      'run bar --link http://foo.bar/ --message Commit message',
      'has-report no-report',
      'run no-report --link http://foo.bar/ --message Commit message',
      'compare no-report bar --link http://foo.bar/ --message Commit message --author Tom Dooner <tom@dooner.com>',
    ]);
    expect(getGitLog()).toEqual([
      'rev-parse no-report',
      'rev-parse bar',
      'checkout --force --quiet bar',
      'show -s --format=%s',
      'checkout --force --quiet no-report',
      'show -s --format=%s',
      'show -s --format=%s',
      'show -s --format=%ae',
      'checkout --force --quiet bar',
    ]);
  });
});

describe('when the compare call fails', () => {
  beforeEach(() => {
    env.PREVIOUS_SHA = 'fail';
  });

  it('fails the script', () => {
    expect(subject).toThrow();
    expect(getCliLog()).toEqual([
      'start-job fail bar',
      'run bar --link http://foo.bar/ --message Commit message',
      'has-report fail',
      'compare fail bar --link http://foo.bar/ --message Commit message --author Tom Dooner <tom@dooner.com>',
    ]);
    expect(getGitLog()).toEqual([
      'rev-parse fail',
      'rev-parse bar',
      'checkout --force --quiet bar',
      'show -s --format=%s',
      'show -s --format=%s',
      'show -s --format=%ae',
      'checkout --force --quiet bar',
    ]);
  });
});

describe('when happo.io is not installed for the PREVIOUS_SHA', () => {
  beforeEach(() => {
    env.PREVIOUS_SHA = 'no-happo';
  });

  it('runs the right happo commands', () => {
    subject();
    expect(getCliLog()).toEqual([
      'start-job no-happo bar',
      'run bar --link http://foo.bar/ --message Commit message',
      'has-report no-happo',
      'empty no-happo',
      'compare no-happo bar --link http://foo.bar/ --message Commit message --author Tom Dooner <tom@dooner.com>',
    ]);
    expect(getGitLog()).toEqual([
      'rev-parse no-happo',
      'rev-parse bar',
      'checkout --force --quiet bar',
      'show -s --format=%s',
      'checkout --force --quiet no-happo',
      'show -s --format=%s',
      'show -s --format=%s',
      'show -s --format=%ae',
      'checkout --force --quiet bar',
    ]);
  });
});
