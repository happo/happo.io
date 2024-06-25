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
    return fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
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

describe('when HAPPO_COMMAND is pointing to a non-existant file', () => {
  beforeEach(() => {
    env.HAPPO_COMMAND = './foo/bar.js';
  });

  it('fails with a message', () => {
    expect(subject).toThrow(/Failed to execute \.\/foo\/bar\.js/);
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
      'version',
      'run bar --link http://foo.bar/ --message Commit message',
    ]);
    expect(getGitLog()).toEqual([
      'rev-parse bar',
      'rev-parse bar',
      'log --format=%H --first-parent --max-count=50 bar^',
      'show -s --format=%s',
    ]);
  });
});

describe('when there is a report for PREVIOUS_SHA', () => {
  it('runs the right happo commands', () => {
    subject();
    expect(getCliLog()).toEqual([
      'version',
      'start-job foo bar --link http://foo.bar/ --message Commit message',
      'run bar --link http://foo.bar/ --message Commit message',
      'compare foo bar --link http://foo.bar/ --message Commit message --author Tom Dooner <tom@dooner.com>',
    ]);
    expect(getGitLog()).toEqual([
      'rev-parse foo',
      'rev-parse bar',
      'log --format=%H --first-parent --max-count=50 foo^',
      'show -s --format=%s',
      'show -s --format=%ae',
      'show -s --format=%s',
    ]);
  });

  describe('when HAPPO_IS_ASYNC=false', () => {
    beforeEach(() => {
      env.HAPPO_IS_ASYNC = 'false';
    });

    it('runs the right happo commands', () => {
      subject();
      expect(getCliLog()).toEqual([
        'version',
        'start-job foo bar --link http://foo.bar/ --message Commit message',
        'run bar --link http://foo.bar/ --message Commit message',
        'has-report foo',
        'compare foo bar --link http://foo.bar/ --message Commit message --author Tom Dooner <tom@dooner.com>',
      ]);
      expect(getGitLog()).toEqual([
        'rev-parse foo',
        'rev-parse bar',
        'log --format=%H --first-parent --max-count=50 foo^',
        'show -s --format=%s',
        'show -s --format=%ae',
        'rev-parse HEAD',
        'show -s --format=%s',
      ]);
    });
  });

  describe('when HAPPO_SKIP_START_JOB is set', () => {
    beforeEach(() => {
      env.HAPPO_SKIP_START_JOB = 'true';
    });

    it('runs the right happo commands', () => {
      subject();
      expect(getCliLog()).toEqual([
        'version',
        'run bar --link http://foo.bar/ --message Commit message',
        'compare foo bar --link http://foo.bar/ --message Commit message --author Tom Dooner <tom@dooner.com>',
      ]);
      expect(getGitLog()).toEqual([
        'rev-parse foo',
        'rev-parse bar',
        'log --format=%H --first-parent --max-count=50 foo^',
        'show -s --format=%s',
        'show -s --format=%ae',
        'show -s --format=%s',
      ]);
    });
  });
});
describe('when CURRENT_SHA has the right hash length', () => {
  beforeEach(() => {
    env.CURRENT_SHA = '93a000afa511ff777143ff2aab48748429c2666a';
  });

  it('does not rev-parse to get the full sha', () => {
    subject();
    expect(getGitLog()).toEqual([
      'rev-parse foo',
      'log --format=%H --first-parent --max-count=50 foo^',
      'show -s --format=%s',
      'show -s --format=%ae',
      'show -s --format=%s',
    ]);
  });

  describe('when HAPPO_IS_ASYNC is false', () => {
    beforeEach(() => {
      env.HAPPO_IS_ASYNC = false;
    });

    it('does not rev-parse to get the full sha', () => {
      subject();
      expect(getGitLog()).toEqual([
        'rev-parse foo',
        'log --format=%H --first-parent --max-count=50 foo^',
        'show -s --format=%s',
        'show -s --format=%ae',
        'rev-parse HEAD',
        'checkout --force --quiet 93a000afa511ff777143ff2aab48748429c2666a',
        'show -s --format=%s',
      ]);
    });
  });

  describe('when PREVIOUS_SHA is of the right length as well', () => {
    beforeEach(() => {
      env.PREVIOUS_SHA = '748e8b6a19831f61066a1ba4eb26ecd2ffa98879';
    });

    it('does not rev-parse to get the full sha', () => {
      subject();
      expect(getGitLog()).toEqual([
        'log --format=%H --first-parent --max-count=50 748e8b6a19831f61066a1ba4eb26ecd2ffa98879^',
        'show -s --format=%s',
        'show -s --format=%ae',
        'show -s --format=%s',
      ]);
    });
  });
});

describe('when there is no report for PREVIOUS_SHA', () => {
  beforeEach(() => {
    env.PREVIOUS_SHA = 'no-report';
  });

  it('does not checkout anything, runs a single report', () => {
    subject();
    expect(getCliLog()).toEqual([
      'version',
      'start-job no-report bar --link http://foo.bar/ --message Commit message',
      'run bar --link http://foo.bar/ --message Commit message',
      'compare no-report bar --link http://foo.bar/ --message Commit message --author Tom Dooner <tom@dooner.com>',
    ]);
    expect(getGitLog()).toEqual([
      'rev-parse no-report',
      'rev-parse bar',
      'log --format=%H --first-parent --max-count=50 no-report^',
      'show -s --format=%s',
      'show -s --format=%ae',
      'show -s --format=%s',
    ]);
  });

  describe('when HAPPO_IS_ASYNC=false', () => {
    beforeEach(() => {
      env.HAPPO_IS_ASYNC = 'false';
    });
    it('runs the right happo commands', () => {
      subject();
      expect(getCliLog()).toEqual([
        'version',
        'start-job no-report bar --link http://foo.bar/ --message Commit message',
        'run bar --link http://foo.bar/ --message Commit message',
        'has-report no-report',
        'run no-report --link http://foo.bar/ --message Commit message',
        'compare no-report bar --link http://foo.bar/ --message Commit message --author Tom Dooner <tom@dooner.com>',
      ]);
      expect(getGitLog()).toEqual([
        'rev-parse no-report',
        'rev-parse bar',
        'log --format=%H --first-parent --max-count=50 no-report^',
        'show -s --format=%s',
        'show -s --format=%ae',
        'rev-parse HEAD',
        'show -s --format=%s',
        'rev-parse HEAD',
        'checkout --force --quiet no-report',
        'show -s --format=%s',
        'checkout --force --quiet bar',
      ]);
    });
  });
});

describe('when the compare call fails', () => {
  beforeEach(() => {
    env.PREVIOUS_SHA = 'fail';
  });

  it('fails the script', () => {
    expect(subject).toThrow();
    expect(getCliLog()).toEqual([
      'version',
      'start-job fail bar --link http://foo.bar/ --message Commit message',
      'run bar --link http://foo.bar/ --message Commit message',
      'compare fail bar --link http://foo.bar/ --message Commit message --author Tom Dooner <tom@dooner.com>',
    ]);
    expect(getGitLog()).toEqual([
      'rev-parse fail',
      'rev-parse bar',
      'log --format=%H --first-parent --max-count=50 fail^',
      'show -s --format=%s',
      'show -s --format=%ae',
      'show -s --format=%s',
    ]);
  });
});

describe('when happo.io is not installed for the PREVIOUS_SHA and HAPPO_IS_ASYNC=false', () => {
  beforeEach(() => {
    env.PREVIOUS_SHA = 'no-happo';
    env.HAPPO_IS_ASYNC = 'false';
  });

  it('runs the right happo commands', () => {
    subject();
    expect(getCliLog()).toEqual([
      'version',
      'start-job no-happo bar --link http://foo.bar/ --message Commit message',
      'run bar --link http://foo.bar/ --message Commit message',
      'has-report no-happo',
      'empty no-happo',
      'compare no-happo bar --link http://foo.bar/ --message Commit message --author Tom Dooner <tom@dooner.com>',
    ]);
    expect(getGitLog()).toEqual([
      'rev-parse no-happo',
      'rev-parse bar',
      'log --format=%H --first-parent --max-count=50 no-happo^',
      'show -s --format=%s',
      'show -s --format=%ae',
      'rev-parse HEAD',
      'show -s --format=%s',
      'rev-parse HEAD',
      'checkout --force --quiet no-happo',
      'show -s --format=%s',
      'checkout --force --quiet bar',
    ]);
  });
});
