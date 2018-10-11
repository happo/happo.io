import supportsColor from 'supports-color';

// https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color

function withColorSupport(wrappedFunc) {
  if (supportsColor.stdout && supportsColor.stderr) {
    return wrappedFunc;
  }
  return (msg) => msg;
}
const red = withColorSupport((str) => `\x1b[31m${str}\x1b[0m`);
const green = withColorSupport((str) => `\x1b[32m${str}\x1b[0m`);
const underline = withColorSupport((str) => `\x1b[36m\x1b[4m${str}\x1b[0m`);

export default class Logger {
  constructor({
    stderrPrint = (str) => process.stderr.write(str),
    print = (str) => process.stdout.write(str),
  } = {}) {
    this.print = print;
    this.stderrPrint = stderrPrint;
  }

  mute() {
    this.print = () => null;
    this.stderrPrint = () => null;
  }

  divider() {
    this.info('-----------------------------------------');
  }

  info(msg) {
    this.print(msg.replace(/https?:\/\/[^ ]+/g, underline));
    this.print('\n');
  }

  start(msg) {
    this.print(`${msg} `);
  }

  success(msg) {
    this.print(green('✓'));
    if (msg) {
      this.print(green(` ${msg}`));
    }
    this.print('\n');
  }

  fail(msg) {
    this.print(red('✗'));
    if (msg) {
      this.print(red(` ${msg}`));
    }
    this.print('\n');
  }

  error(e) {
    this.stderrPrint(red(e.stack || e.message));
    this.stderrPrint('\n');
  }
}
