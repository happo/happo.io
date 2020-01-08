import fetchPng from '../src/fetchPng';

let subject;
let url;

beforeEach(() => {
  url = 'https://dummyimage.com/200/000/ffffff.png&text=aa';
  subject = () => fetchPng(url);
});

it('resolves with a bitmap', async () => {
  const bitmap = await subject();
  expect(bitmap.width).toBe(200);
  expect(bitmap.height).toBe(200);
  expect(bitmap.data.length).toBe(160000);
});

describe('with an invalid url', () => {
  beforeEach(() => {
    url = 'asdfasdf';
  });

  it('rejects', async () => {
    expect.assertions = 1;
    try {
      await subject();
    } catch (e) {
      expect(e.message).toMatch('Invalid URI');
    }
  });
});

describe('with a url that is not an image', () => {
  beforeEach(() => {
    url = 'https://google.se/';
  });

  it('rejects', async () => {
    expect.assertions = 1;
    try {
      await subject();
    } catch (e) {
      expect(e.message).toMatch('Invalid file signature');
    }
  });
});
