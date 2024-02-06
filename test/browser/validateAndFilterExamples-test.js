import validateAndFilterExamples from '../../src/browser/validateAndFilterExamples';

let subject;
let examples;
let targetName;
let only;
let chunk;

beforeEach(() => {
  examples = [];
  targetName = 'chrome';
  only = undefined;
  subject = () => validateAndFilterExamples(examples, { targetName, only, chunk });
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

describe('with an only option', () => {
  beforeEach(() => {
    only = { component: 'bar', variant: 'default' };
    examples = [
      {
        component: 'foo',
        variant: 'default',
        fileName: './foo-happo.js',
        render: {
          render: () => 'foobar',
        },
      },
      {
        component: 'bar',
        variant: 'default',
        fileName: './foo-happo.js',
        render: {
          render: () => 'foobar',
        },
      },
    ];
  });

  it('excludes that example', () => {
    expect(subject().length).toBe(1);
    expect(subject()[0].component).toEqual('bar');
  });
});

describe('with a chunk option', () => {
  beforeEach(() => {
    chunk = { total: 3, index: 1 };
    examples = [
      {
        component: 'foo',
        variant: 'default',
        fileName: './foo-happo.js',
        render: {
          render: () => 'foobar',
        },
      },
      {
        component: 'bar',
        variant: 'default',
        fileName: './foo-happo.js',
        render: {
          render: () => 'foobar',
        },
      },
      {
        component: 'baz',
        variant: 'default',
        fileName: './foo-happo.js',
        render: {
          render: () => 'foobar',
        },
      },
    ];
  });

  it('selects a subset of examples', () => {
    expect(subject().length).toBe(1);
    expect(subject()[0].component).toEqual('bar');

    chunk.index = 0;
    expect(subject().length).toBe(1);
    expect(subject()[0].component).toEqual('foo');
  });
});
