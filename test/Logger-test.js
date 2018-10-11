import Logger from '../src/Logger';

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
  expect(print.mock.calls.length).toBe(0);
});

it('logs errors with stacks', () => {
  const error = new Error('damn');
  error.stack = 'foobar';
  subject().error(error);
  // We have to use `toMatch` here because the string is wrapped with color
  // instruction characters
  expect(stderrPrint.mock.calls[0][0]).toMatch(/foobar/);
});

it('logs errors without stacks', () => {
  const error = new Error('damn');
  delete error.stack;
  subject().error(error);
  // We have to use `toMatch` here because the string is wrapped with color
  // instruction characters
  expect(stderrPrint.mock.calls[0][0]).toMatch(/damn/);
});
