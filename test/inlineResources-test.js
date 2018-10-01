import path from 'path';

import inlineResources from '../src/inlineResources';

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

it('does not fail when there are no publicFolders', () => {
  const html = '<img src="/1x1.png">';
  expect(inlineResources(html, { publicFolders: undefined })).toEqual('<img src="/1x1.png">');
});

it('inlines images that can be found', () => {
  const html = '<img src="/1x1.png">';
  expect(inlineResources(html, { publicFolders })).toEqual(`<img src="${pngb64}">`);
});

it('inlines svg', () => {
  const html = '<img src="/circle.svg">';
  expect(inlineResources(html, { publicFolders })).toEqual(`<img src="${svgb64}">`);
});

it('inlines jpg', () => {
  const html = '<img src="/1x1.jpg">';
  expect(inlineResources(html, { publicFolders })).toEqual(`<img src="${jpgb64}">`);
});

it('inlines multiple images', () => {
  const html = `
    <div>
      <img src="/1x1.jpg">
      <img src="/1x1.png">
      <img src="/circle.svg">
      <img src="/1x1.jpg">
    </div>
  `;
  expect(inlineResources(html, { publicFolders })).toEqual(
    `
    <div>
      <img src="${jpgb64}">
      <img src="${pngb64}">
      <img src="${svgb64}">
      <img src="${jpgb64}">
    </div>
  `.trim(),
  );
});

it('inlines srcset attributes', () => {
  const html = `
    <img src="/1x1.jpg" srcset="/1x1.jpg 197w, /1x1.png 393w, http://dns/1.png 600w">
  `;
  expect(inlineResources(html, { publicFolders })).toEqual(
    `
    <img src="${jpgb64}" srcset="${jpgb64} 197w, ${pngb64} 393w, http://dns/1.png 600w">
  `.trim(),
  );
});

it('handles invalid srcset attributes', () => {
  const html = `
    <img srcset="    ">
  `;
  expect(inlineResources(html, { publicFolders })).toEqual(
    `
    <img srcset="">
  `.trim(),
  );
});

it('handles single-url srcsets', () => {
  const html = `
    <img srcset="/1x1.png">
  `;
  expect(inlineResources(html, { publicFolders })).toEqual(
    `
    <img srcset="${pngb64}">
  `.trim(),
  );
});

it('handles single-url srcsets with external urls', () => {
  const html = `
    <img srcset="http://foo/1.png">
  `;
  expect(inlineResources(html, { publicFolders })).toEqual(
    `
    <img srcset="http://foo/1.png">
  `.trim(),
  );
});

it('handles srcset that can not be found', () => {
  const html = `
    <img srcset="/f1,2,3.png 100w, /f1,3.png 200w">
  `;
  expect(inlineResources(html, { publicFolders })).toEqual(
    `
    <img srcset="/f1,2,3.png 100w, /f1,3.png 200w">
  `.trim(),
  );
});

it('handles srcset with plenty of whitespace', () => {
  const html = `
    <img srcset="
      /1x1.png    100w,
      /f1,3.png   200w"
    >
  `;
  expect(inlineResources(html, { publicFolders })).toEqual(
    `
    <img srcset="${pngb64}    100w, /f1,3.png   200w">
  `.trim(),
  );
});
it('leaves images that can not be found alone', () => {
  const html = '<img src="/2x2.png">';
  expect(inlineResources(html, { publicFolders })).toEqual('<img src="/2x2.png">');
});

it('handles files in folders that do not exist', () => {
  const html = '<img src="/inlineResources/1x1.png">';
  expect(inlineResources(html, { publicFolders })).toEqual('<img src="/inlineResources/1x1.png">');
});

it('leaves src if it does not start with a slash', () => {
  const html = '<img src="1x1.png">';
  expect(inlineResources(html, { publicFolders })).toEqual('<img src="1x1.png">');
});
