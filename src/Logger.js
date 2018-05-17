export default class Logger {
  constructor() {
    this.print = (str) => process.stdout.write(str);
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
    this.print(msg);
    this.print('\n');
  }

  start(msg) {
    this.print(msg);
  }

  success(msg) {
    this.print(' ✓');
    if (msg) {
      this.print(` ${msg}`);
    }
    this.print('\n');
  }

  fail(msg) {
    this.print(' ✗');
    if (msg) {
      this.print(` ${msg}`);
    }
    this.print('\n');
  }

  error(e) {
    this.stderrPrint(e.stack);
    this.stderrPrint('\n');
  }
}
