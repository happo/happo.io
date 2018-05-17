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
  constructor() {
    this.printed = '';
    this.print = (str, isEdit) => {
      process.stdout.write(str);
      if (!isEdit) {
        this.printed += str;
      }
    };
    this.stderrPrint = (str) => process.stderr.write(str);
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
    this.stderrPrint(red(e.stack));
    this.stderrPrint('\n');
  }

  edit(msg, success) {
    const print = () => {
      this.print(`${msg} `, true);
      if (success) {
        this.print(green('✓'), true);
      } else {
        this.print(red('✗'), true);
      }
      this.print('\n', true);
    };
    let index;
    if (typeof process.stdout.moveCursor === 'function') {
      const lines = this.printed.split('\n').reverse();
      index = lines.indexOf(msg);
      process.stdout.moveCursor(0, -index);
      print();
      process.stdout.moveCursor(0, index);
    } else {
      print();
    }
  }
}
