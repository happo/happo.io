import path from 'path';

import inlineResources from '../src/inlineResources';

let html;
let subject;

beforeEach(() => {
  html = '';

  subject = () => {
    document.body.innerHTML = html;
    inlineResources({ publicFolders });
    return document.body.innerHTML;
  };
});

const publicFolders = [
  path.resolve(__dirname, 'non-existant'),
  path.resolve(__dirname, 'inlineResources'),
];

const pngb64 = 'data:image/png;charset=utf-8;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP6DwABBQECz6AuzQAAAABJRU5ErkJggg==';

const svgb64 = 'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIvPgo8L3N2Zz4K';

const jpgb64 = 'data:image/jpg;charset=utf-8;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AfwD/2Q==';

it('inlines images that can be found', () => {
  html = '<img src="/1x1.png">';
  expect(subject()).toEqual(`<img src="${pngb64}">`);
});

it('inlines svg', () => {
  html = '<img src="/circle.svg">';
  expect(subject()).toEqual(`<img src="${svgb64}">`);
});

it('inlines jpg', () => {
  html = '<img src="/1x1.jpg">';
  expect(subject()).toEqual(`<img src="${jpgb64}">`);
});

it('inlines multiple images', () => {
  html = `
    <div>
      <img src="/1x1.jpg">
      <img src="/1x1.png">
      <img src="/circle.svg">
      <img src="/1x1.jpg">
    </div>
  `.trim();
  expect(subject()).toEqual(`
    <div>
      <img src="${jpgb64}">
      <img src="${pngb64}">
      <img src="${svgb64}">
      <img src="${jpgb64}">
    </div>
  `.trim());
});

it('leaves images that can not be found alone', () => {
  html = '<img src="/2x2.png">';
  expect(subject()).toEqual('<img src="/2x2.png">');
});

it('handles files in folders that do not exist', () => {
  html = '<img src="/inlineResources/1x1.png">';
  expect(subject()).toEqual('<img src="/inlineResources/1x1.png">');
});

it('leaves src if it does not start with a slash', () => {
  html = '<img src="1x1.png">';
  expect(subject()).toEqual('<img src="1x1.png">');
});
