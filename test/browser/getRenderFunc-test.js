import getRenderFunc from '../../src/browser/getRenderFunc';

let subject;
let variant;

beforeEach(() => {
  variant = () => 'foobar';
  subject = () => getRenderFunc(variant);
});

describe('with a regular function', () => {
  it('returns that function', () => {
    expect(subject()).toBe(variant);
  });
});

describe('with an object with a `render` prop', () => {
  beforeEach(() => {
    variant = { render: () => 'google' };
  });

  it('returns the render function', () => {
    expect(subject()).toBe(variant.render);
  });
});

describe('when variant is undefined', () => {
  beforeEach(() => {
    variant = undefined;
  });

  it('returns undefined', () => {
    expect(subject()).toBe(undefined);
  });
});

describe('when variant is null', () => {
  beforeEach(() => {
    variant = null;
  });

  it('returns undefined', () => {
    expect(subject()).toBe(undefined);
  });
});
