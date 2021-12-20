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
const dim = withColorSupport((str) => `\x1b[90m${str}\x1b[0m`);
const underline = withColorSupport((str) => `\x1b[36m\x1b[4m${str}\x1b[0m`);

export function logTag(project) {
  return project ? `[${project}] ` : '';
}

function printDuration(print, startTime) {
  if (startTime) {
    print(dim(` (${(Date.now() - startTime)}ms)`));
  }
}

export default class Logger {
  constructor({
    stderrPrint = (str) => process.stderr.write(str),
    print = (str) => process.stdout.write(str),
  } = {}) {
    this.print = print;
    this.stderrPrint = stderrPrint;
    this.startTime = undefined;
    this.startMsg = undefined;
  }

  mute() {
    this.print = () => null;
    this.stderrPrint = () => null;
  }

  divider() {
    this.info('-----------------------------------------');
  }

  info(msg) {
    this.print(`${msg}`.replace(/https?:\/\/[^ ]+/g, underline));
    this.print('\n');
  }

  start(msg, { startTime } = {}) {
    this.startTime = startTime || Date.now();
    this.startMsg = msg;
    if (msg) {
      this.print(`Starting: ${msg} `);
      this.print('\n');
    }
  }

  success(msg) {
    this.print(green('✓'));

    if (this.startMsg) {
      this.print(green(` ${this.startMsg}:`));
    }

    if (msg) {
      this.print(green(` ${msg}`));
    }
    printDuration(this.print, this.startTime);
    this.print('\n');

    this.startMsg = undefined;
  }

  fail(msg) {
    this.print(red('✗'));

    if (this.startMsg) {
      this.print(red(` ${this.startMsg}:`));
    }

    if (msg) {
      this.print(red(` ${msg}`));
    }
    printDuration(this.print, this.startTime);
    this.print('\n');

    this.startMsg = undefined;
  }

  error(e) {
    let stack = e.stack;
    if (stack) {
      stack = stack.split(`file://${process.cwd()}/`).join('');
    }
    this.stderrPrint(red(stack || e.message || e));
    this.stderrPrint('\n');
  }

  warn(message) {
    this.stderrPrint(red(message));
    this.stderrPrint('\n');
  }
}
