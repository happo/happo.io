import Logger, { logTag } from '../src/Logger';

let subject;
let stderrPrint;
let print;

function getCleanLogs(mockedFn) {
  return (
    mockedFn.mock.calls
      .map(([str]) => str)
      .join('')
      // eslint-disable-next-line no-control-regex
      .replace(/\x1b\[\d{1,2}m/g, '')
  );
}

jest.useFakeTimers('modern');

beforeEach(() => {
  stderrPrint = jest.fn();
  print = jest.fn();
  subject = () => new Logger({ print, stderrPrint });
});

it('works without injected printers', () => {
  // This test is here just to make sure that the dependency injection of the
  // `print` and `stderrPrint` functions isn't causing any issues
  const error = new Error('Ignore this log');
  delete error.stack;
  new Logger().error(error);
  new Logger().info('Ignore this log');
});

it('does not print to stdout on errors', () => {
  subject().error(new Error('foo'));
  expect(print).toHaveBeenCalledTimes(0);
});

it('prints to stderr on errors', () => {
  subject().error(new Error('foo'));
  expect(stderrPrint).toHaveBeenCalledTimes(2);
});

it('logs errors with stacks', () => {
  const error = new Error('damn');
  error.stack = 'foobar';
  subject().error(error);
  // We use `stringContaining` here because the string is wrapped with color
  // instruction characters
  expect(stderrPrint).toHaveBeenNthCalledWith(1, expect.stringContaining('foobar'));
});

it('logs errors without stacks', () => {
  const error = new Error('damn');
  delete error.stack;
  subject().error(error);
  // We use `stringContaining` here because the string is wrapped with color
  // instruction characters
  expect(stderrPrint).toHaveBeenNthCalledWith(1, expect.stringContaining('damn'));
});

it('logs "Starting: msg" with start(msg)', () => {
  const logger = subject();

  logger.start('Pizza');
  expect(print).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining('Starting: Pizza'),
  );
});

it('logs nothing with start()', () => {
  const logger = subject();

  logger.start();
  expect(print).toHaveBeenCalledTimes(0);
});

it('logs start message with success()', () => {
  const logger = subject();

  logger.start('Pizza');
  print.mockReset();

  logger.success('Yum');
  expect(print).toHaveBeenNthCalledWith(1, expect.stringContaining('✓'));
  expect(print).toHaveBeenNthCalledWith(2, expect.stringContaining('Pizza:'));
});

it('handles no start message with success()', () => {
  const logger = subject();

  logger.start();
  print.mockReset();

  logger.success('Yum');
  expect(print).toHaveBeenNthCalledWith(1, expect.stringContaining('✓'));
});

it('logs durations with start() and success()', () => {
  const logger = subject();

  logger.start('Pizza');
  expect(print).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining('Starting: Pizza'),
  );
  expect(stderrPrint).toHaveBeenCalledTimes(0);
  print.mockReset();

  jest.advanceTimersByTime(12);

  logger.success('Yum');
  expect(print).toHaveBeenNthCalledWith(3, expect.stringContaining('Yum'));
  expect(print).toHaveBeenNthCalledWith(4, expect.stringMatching(/\(\d+ms\)/));
  expect(stderrPrint).toHaveBeenCalledTimes(0);

  expect(getCleanLogs(print)).toMatchInlineSnapshot(`
    "✓ Pizza: Yum (12ms)
    "
  `);
});

it('logs durations with start() and fail()', () => {
  const logger = subject();

  logger.start('Pizza');
  expect(print).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining('Starting: Pizza'),
  );
  expect(stderrPrint).toHaveBeenCalledTimes(0);
  print.mockReset();

  jest.advanceTimersByTime(13);

  logger.fail('Yuck');
  expect(print).toHaveBeenNthCalledWith(3, expect.stringContaining('Yuck'));
  expect(print).toHaveBeenNthCalledWith(4, expect.stringMatching(/\(\d+ms\)/));
  expect(stderrPrint).toHaveBeenCalledTimes(0);

  expect(getCleanLogs(print)).toMatchInlineSnapshot(`
    "✗ Pizza: Yuck (13ms)
    "
  `);
});

it('logs start message with fail()', () => {
  const logger = subject();

  logger.start('Pizza');
  print.mockReset();

  logger.fail('Yuck');
  expect(print).toHaveBeenNthCalledWith(1, expect.stringContaining('✗'));
  expect(print).toHaveBeenNthCalledWith(2, expect.stringContaining(' Pizza:'));
});

describe('logTag()', () => {
  it('is empty with no project', () => {
    expect(logTag(null)).toEqual('');
    expect(logTag(undefined)).toEqual('');
    expect(logTag('')).toEqual('');
  });

  it('is [project] with a project', () => {
    expect(logTag('pizza')).toEqual('[pizza] ');
  });
});
