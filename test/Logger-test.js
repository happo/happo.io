import Logger, { logTag } from '../src/Logger';

let subject;
let stderrPrint;
let print;

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

it('logs durations with start() and success()', () => {
  const logger = subject();

  logger.start('Pizza');
  expect(print).toHaveBeenNthCalledWith(1, expect.stringContaining('Pizza'));
  print.mockReset();

  logger.success('Yum');
  expect(print).toHaveBeenNthCalledWith(2, expect.stringContaining('Yum'));
  expect(print).toHaveBeenNthCalledWith(3, expect.stringMatching(/\(\d+\.\d+ms\)/));
});

it('logs durations with start() and fail()', () => {
  const logger = subject();

  logger.start('Pizza');
  expect(print).toHaveBeenNthCalledWith(1, expect.stringContaining('Pizza'));
  print.mockReset();

  logger.fail('Yuck');
  expect(print).toHaveBeenNthCalledWith(2, expect.stringContaining('Yuck'));
  expect(print).toHaveBeenNthCalledWith(3, expect.stringMatching(/\(\d+\.\d+ms\)/));
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
