import validateAndFilterExamples from '../../src/browser/validateAndFilterExamples';

let subject;
let examples;
let targetName;

beforeEach(() => {
  examples = [];
  targetName = 'chrome';
  subject = () => validateAndFilterExamples(examples, { targetName });
});

describe('with an empty list', () => {
  it('returns an empty list', () => {
    expect(subject()).toEqual([]);
  });
});

describe('with examples that do not have a render function', () => {
  beforeEach(() => {
    examples = [
      {
        component: 'foo',
        variant: 'default',
        fileName: './foo-happo.js',
        render: () => 'foobar',
      },
      {
        component: 'foo',
        variant: 'bogus',
        fileName: './foo-happo.js',
      },
    ];
  });

  it('throws an error for those that will not render', () => {
    expect(subject).toThrow(/Variant bogus in component foo/);
  });
});

describe('when an example has opted in to the target', () => {
  beforeEach(() => {
    examples = [
      {
        component: 'foo',
        variant: 'default',
        fileName: './foo-happo.js',
        render: {
          render: () => 'foobar',
          targets: ['chrome', 'firefox'],
        },
      },
    ];
  });

  it('includes that example', () => {
    expect(subject()).toEqual([examples[0]]);
  });
});

describe('when an example has opted out of the target', () => {
  beforeEach(() => {
    examples = [
      {
        component: 'foo',
        variant: 'default',
        fileName: './foo-happo.js',
        render: {
          render: () => 'foobar',
          targets: ['firefox'],
        },
      },
    ];
  });

  it('excludes that example', () => {
    expect(subject()).toEqual([]);
  });
});
