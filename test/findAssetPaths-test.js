import { JSDOM } from 'jsdom';

import findAssetPaths from '../src/findAssetPaths';

let subject;
let html;

beforeEach(() => {
  html = '';
  subject = () => {
    const dom = new JSDOM('<!DOCTYPE html>', {
      url: 'http://localhost',
    });
    dom.window.document.body.innerHTML = html;
    return findAssetPaths(dom.window.document);
  };
});

it('finds images', () => {
  html = '<img src="/1x1.png">';
  expect(subject()).toEqual(['/1x1.png']);
});

it('finds path-relative urls', () => {
  html = '<img src="circle.svg">';
  expect(subject()).toEqual(['circle.svg']);
});

it('does not find empty images', () => {
  html = '<img src=""><img src=" ">';
  expect(subject()).toEqual([]);
});

it('finds multiple images', () => {
  html = `
    <div>
      <img src="/1x1.jpg">
      <img src="/1x1.png">
      <img src="/circle.svg">
      <img src="/1x1.jpg">
    </div>
  `;
  expect(subject()).toEqual(['/1x1.jpg', '/1x1.png', '/circle.svg', '/1x1.jpg']);
});

it('finds assets in srcset attributes', () => {
  html = `
    <img src="/1x1.jpg" srcset="/1x1.jpg 197w, /1x1.png 393w, http://dns/1.png 600w">
  `;
  expect(subject()).toEqual(['/1x1.jpg', '/1x1.jpg', '/1x1.png']);
});

it('handles invalid srcset attributes', () => {
  html = `
    <img srcset="    ">
  `;
  expect(subject()).toEqual([]);
});

it('handles single-url srcsets', () => {
  html = `
    <img srcset="/1x1.png">
  `;
  expect(subject()).toEqual(['/1x1.png']);
});

it('handles single-url srcsets with external urls', () => {
  html = `
    <img srcset="http://foo/1.png">
  `;
  expect(subject()).toEqual([]);
});

it('handles srcset with commas', () => {
  html = `
    <img srcset="/f1,2,3.png 100w, /f1,3.png 200w">
  `;
  expect(subject()).toEqual(['/f1,2,3.png', '/f1,3.png']);
});

it('handles srcset with plenty of whitespace', () => {
  html = `
    <img srcset="
      /1x1.png    100w,
      /f1,3.png   200w"
    >
  `;
  expect(subject()).toEqual(['/1x1.png', '/f1,3.png']);
});
