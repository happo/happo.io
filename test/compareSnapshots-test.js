import compareSnapshots from '../src/compareSnapshots';

let subject;
let before;
let after;

beforeEach(() => {
  before = {
    url: 'https://happo.io/img/happo-io/93eb2d9e57d43b0b5ca5527587484f18',
    component: 'Foo',
    variant: 'bar',
    target: 'chrome',
    width: 800,
    height: 178,
  };
  after = {
    url: 'https://happo.io/img/happo-io/4a340716fa580b80d9f87330d79903dc',
    component: 'Foo',
    variant: 'bar',
    target: 'chrome',
    width: 800,
    height: 178,
  };
  subject = () =>
    compareSnapshots({ before, after, endpoint: 'https://dummyimage.com' });
});

it('returns the diff between images', async () => {
  expect(await subject()).toEqual(0.0016979421882410417);
});

describe('when images are completely different', () => {
  beforeEach(() => {
    before.url = 'https://dummyimage.com/20/000/000000.png';
    before.width = 20;
    before.height = 20;

    after.url = 'https://dummyimage.com/20/fff/ffffff.png';
    after.width = 20;
    after.height = 20;
  });

  it('returns the diff between images', async () => {
    // This isn't equal to 1 because all pixels are opaque
    expect(await subject()).toEqual(0.8660254037844365);
  });
});

describe('when images are almost identical', () => {
  beforeEach(() => {
    before.url = 'https://dummyimage.com/200/000/ffffff.png&text=aa';
    before.width = 200;
    before.height = 200;

    after.url = 'https://dummyimage.com/200/000/f7f7f7.png&text=aa';
    after.width = 200;
    after.height = 200;
  });

  it('returns the diff between images', async () => {
    // This isn't equal to 1 because all pixels are opaque
    expect(await subject()).toEqual(0.0017500505512553482);
  });
});
