// Inspired by https://stackoverflow.com/questions/42754270/re-throwing-exception-in-nodejs-and-not-losing-stack-trace
export default class WrappedError extends Error {
  constructor(message, error) {
    super(message);
    this.original = error;
    Error.captureStackTrace(this, this.constructor);
    const newLines = this.message.split(/\n/).length;
    const diff = this.stack
      .split('\n')
      .slice(0, newLines + 1)
      .join('\n');
    this.stack = `${diff}\n${error.stack}`;
    this.isError = true;
  }
}
