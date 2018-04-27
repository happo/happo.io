import path from 'path';

import inlineCSSResources from '../src/inlineCSSResources';

const publicFolders = [
  path.resolve(__dirname, 'non-existant'),
  path.resolve(__dirname, 'inlineResources'),
];

const pngb64 =
  'data:image/png;charset=utf-8;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP6DwABBQECz6AuzQAAAABJRU5ErkJggg==';

const svgb64 =
  'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIvPgo8L3N2Zz4K';

const jpgb64 =
  'data:image/jpg;charset=utf-8;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwD/2Q==';

let subject;
let css;

beforeEach(() => {
  subject = () => inlineCSSResources(css, { publicFolders });
});

it('inlines images that can be found', () => {
  css = '.body { background-image: url("/1x1.png");';
  expect(subject()).toEqual(`.body { background-image: url('${pngb64}');`);
});

it('inlines svg', () => {
  css = '.body { background-image: url(/circle.svg);';
  expect(subject()).toEqual(`.body { background-image: url('${svgb64}');`);
});

it('inlines jpg', () => {
  css = '.body { background-image: url(/1x1.jpg);';
  expect(subject()).toEqual(`.body { background-image: url('${jpgb64}');`);
});

it('inlines multiple images', () => {
  css = `
    .body { background-image: url(/1x1.jpg); }
    .foo {
      background-image: url(/1x1.png);
    }
    .bar { baz: url(/circle.svg); }
    .car { d: url(/circle.svg) url(/1x1.jpg); }
  `;
  expect(subject()).toEqual(
    `
    .body { background-image: url('${jpgb64}'); }
    .foo {
      background-image: url('${pngb64}');
    }
    .bar { baz: url('${svgb64}'); }
    .car { d: url('${svgb64}') url('${jpgb64}'); }
  `,
  );
});

it('leaves images that can not be found alone', () => {
  css = ".a { b: url('/2x2.jpg') }";
  expect(subject()).toEqual(css);
});

it('handles files in folders that do not exist', () => {
  css = ".a { b: url('/foobar/1x1.jpg') }";
  expect(subject()).toEqual(css);
});

it('leaves src if it does not start with a slash', () => {
  css = '.a { b: url(1x1.jpg) }';
  expect(subject()).toEqual(css);
});
