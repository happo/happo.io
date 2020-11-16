import { performance } from 'perf_hooks';

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

export default class Logger {
  constructor({
    stderrPrint = (str) => process.stderr.write(str),
    print = (str) => process.stdout.write(str),
  } = {}) {
    this.print = print;
    this.stderrPrint = stderrPrint;
    this.startTime = undefined;
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
    this.startTime = startTime || performance.now();
    if (msg) {
      this.print(`${msg} `);
    }
  }

  printDuration() {
    if (this.startTime) {
      this.print(dim(` (${(performance.now() - this.startTime).toFixed(1)}ms)`));
    }
  }

  success(msg) {
    this.print(green('✓'));
    if (msg) {
      this.print(green(` ${msg}`));
    }
    this.printDuration();
    this.print('\n');
  }

  fail(msg) {
    this.print(red('✗'));
    if (msg) {
      this.print(red(` ${msg}`));
    }
    this.printDuration();
    this.print('\n');
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
