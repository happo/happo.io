import { spawn } from 'child_process';

const happoCommand = require.resolve('../build/cli');

let subject;
let command;

beforeEach(() => {
  command = undefined;
  subject = () =>
    new Promise((resolve) => {
      let stdout = '';
      let stderr = '';

      const cmd = spawn(happoCommand, command);

      cmd.stdout.on('data', (data) => {
        stdout += data;
      });
      cmd.stderr.on('data', (data) => {
        stderr += data;
      });

      cmd.on('close', (exitCode) => {
        resolve({
          exitCode,
          stdout,
          stderr,
        });
      });
    });
});

describe('when no command is given', () => {
  it('displays help', async () => {
    const result = await subject();
    expect(result.stdout).toMatch(/^Usage: /);
  });

  it('exits with a non-zero exit code', async () => {
    const result = await subject();
    expect(result.exitCode).toEqual(1);
  });
});

describe('when an invalid command is given', () => {
  beforeEach(() => {
    command = ['foobar'];
  });

  it('displays help', async () => {
    const result = await subject();
    expect(result.stdout).toMatch(/Usage: /m);
  });

  it('warns about invalid command', async () => {
    const result = await subject();
    expect(result.stdout).toMatch(/Invalid command: "foobar"/);
  });

  it('exits with a non-zero exit code', async () => {
    const result = await subject();
    expect(result.exitCode).toEqual(1);
  });
});

describe('happo compare', () => {
  describe('without shas', () => {
    beforeEach(() => {
      command = ['compare'];
    });

    it('displays help', async () => {
      const result = await subject();
      expect(result.stderr).toMatch(/missing required argument.*sha1/m);
    });

    it('exits with a non-zero exit code', async () => {
      const result = await subject();
      expect(result.exitCode).toEqual(1);
    });
  });

  describe('with misconfigured fallbackShas', () => {
    beforeEach(() => {
      command = ['compare', 'a', 'b', '--fallbackShas'];
    });

    it('displays help', async () => {
      const result = await subject();
      expect(result.stderr).toMatch(/--fallbackShas.*argument missing/m);
    });

    it('exits with a non-zero exit code', async () => {
      const result = await subject();
      expect(result.exitCode).toEqual(1);
    });
  });

  describe('with fallbackShas', () => {
    beforeEach(() => {
      command = ['compare', 'a', 'b', '--fallbackShas', 'd,e,f'];
    });

    it('does not warn about missing argument', async () => {
      const result = await subject();
      expect(result.stderr).not.toMatch(/--fallbackShas.*argument missing/m);
    });
  });
});
