import { spawn } from 'child_process';

const happoCommand = require.resolve('../build/cli');

let subject;
let command;

beforeEach(() => {
  command = '';
  subject = () =>
    new Promise((resolve) => {
      let stdout = '';

      const cmd = spawn(happoCommand, command ? [command] : undefined);

      cmd.stdout.on('data', (data) => {
        stdout += data;
      });

      cmd.on('close', (exitCode) => {
        resolve({
          exitCode,
          stdout,
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
    command = 'foobar';
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
