export default class MultipleErrors extends Error {
  constructor(errors) {
    super(`Found ${errors.length} error(s)`);
    this.stack = this.message + '\n\n' +
      errors.map(({ stack }) => stack).join('\n----------------\n');
  }
}
