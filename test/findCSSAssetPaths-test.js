import path from 'path';

import findCSSAssetPaths from '../src/findCSSAssetPaths';

let subject;
let css;
let source;

beforeEach(() => {
  css = '';
  source = undefined;
  subject = () => findCSSAssetPaths({ css, source });
});

it('finds images', () => {
  css = '.body { background-image: url("/1x1.png");';
  expect(subject()).toEqual([{ assetPath: '/1x1.png', resolvePath: '/1x1.png' }]);
});

it('finds svg', () => {
  css = '.body { background-image: url(circle.svg);';
  expect(subject()).toEqual([{ assetPath: 'circle.svg', resolvePath: 'circle.svg' }]);
});

it('finds jpg', () => {
  css = '.body { background-image: url(/1x1.jpg);';
  expect(subject()).toEqual([{ assetPath: '/1x1.jpg', resolvePath: '/1x1.jpg' }]);
});

it('does not find absolute urls', () => {
  css = `
    .body { background-image: url(//google.com/foo.png); }
    .foo { background: url("http://goo.com"); }
  `;
  expect(subject()).toEqual([]);
});

it('finds multiple images', () => {
  css = `
    .body { background-image: url(/1x1.jpg); }
    .foo {
      background-image: url(/1x1.png);
    }
    .bar { baz: url(/circle.svg); }
    .car { d: url(/circle.svg) url(/1x1.jpg); }
  `;
  expect(subject()).toEqual([
    { assetPath: '/1x1.jpg', resolvePath: '/1x1.jpg' },
    { assetPath: '/1x1.png', resolvePath: '/1x1.png' },
    { assetPath: '/circle.svg', resolvePath: '/circle.svg' },
    { assetPath: '/circle.svg', resolvePath: '/circle.svg' },
    { assetPath: '/1x1.jpg', resolvePath: '/1x1.jpg' },
  ]);
});

describe('when there is a source', () => {
  beforeEach(() => {
    css = '.body { background-image: url("baz/1x1.png");';
    source = path.join(__dirname, 'foo/bar/test.css');
  });

  it('returns absolute paths', () => {
    expect(subject()).toEqual([{
      assetPath: path.join(__dirname, 'foo/bar/baz/1x1.png'),
      resolvePath: 'baz/1x1.png',
    }]);
  });
});
