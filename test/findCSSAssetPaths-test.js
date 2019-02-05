import findCSSAssetPaths from '../src/findCSSAssetPaths';

let subject;
let css;

beforeEach(() => {
  subject = () => findCSSAssetPaths(css);
});

it('finds images', () => {
  css = '.body { background-image: url("/1x1.png");';
  expect(subject()).toEqual(['/1x1.png']);
});

it('finds svg', () => {
  css = '.body { background-image: url(circle.svg);';
  expect(subject()).toEqual(['circle.svg']);
});

it('finds jpg', () => {
  css = '.body { background-image: url(/1x1.jpg);';
  expect(subject()).toEqual(['/1x1.jpg']);
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
  expect(subject()).toEqual(['/1x1.jpg', '/1x1.png', '/circle.svg', '/circle.svg', '/1x1.jpg']);
});
