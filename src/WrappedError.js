// Inspired by https://stackoverflow.com/questions/42754270/re-throwing-exception-in-nodejs-and-not-losing-stack-trace
export default class WrappedError extends Error {
  constructor(message, error) {
    super(message);
    this.cause = error;
    this.isError = true;
  }
}
