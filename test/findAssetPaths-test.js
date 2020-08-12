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

it('strips query strings', () => {
  html = '<img src="circle.svg?pizza=yum">';
  expect(subject()).toEqual(['circle.svg']);
});

it('strips hashes', () => {
  html = '<img src="circle.svg#pizza">';
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

it('finds assets in inline styles', () => {
  html = `
    <div>
      <div style="background-image: url(1.jpg);" />
      <div style="background-image: url(./2.jpg);" />
      <div style="background-image: url(/3.jpg);" />
      <div style="background-image: url('/4.jpg');" />
      <div style="background-image: url(http://dls/5.jpg);" />
    </div>
  `;
  expect(subject()).toEqual(['1.jpg', './2.jpg', '/3.jpg', '/4.jpg']);
});

it('strips query strings in inline styles', () => {
  html = `
    <div>
      <div style="background-image: url(1.jpg?pizza=yum);" />
      <div style="background-image: url(./2.jpg?pizza=yum);" />
      <div style="background-image: url(/3.jpg?pizza=yum);" />
      <div style="background-image: url('/4.jpg?pizza=yum');" />
      <div style="background-image: url(http://dls/5.jpg?pizza=yum);" />
    </div>
  `;
  expect(subject()).toEqual(['1.jpg', './2.jpg', '/3.jpg', '/4.jpg']);
});

it('strips hashes in inline styles', () => {
  html = `
    <div>
      <div style="background-image: url(1.jpg#pizza);" />
      <div style="background-image: url(./2.jpg#pizza);" />
      <div style="background-image: url(/3.jpg#pizza);" />
      <div style="background-image: url('/4.jpg#pizza);" />
      <div style="background-image: url(http://dls/5.jpg#pizza);" />
    </div>
  `;
  expect(subject()).toEqual(['1.jpg', './2.jpg', '/3.jpg', '/4.jpg']);
});

it('finds assets in img srcset attributes', () => {
  html = `
    <img src="/1x1.jpg" srcset="/1x1.jpg 197w, /1x1.png 393w, http://dns/1.png 600w">
  `;
  expect(subject()).toEqual(['/1x1.jpg', '/1x1.jpg', '/1x1.png']);
});

it('strips query strings in img srcset attributes', () => {
  html = `
    <img src="/1x1.jpg" srcset="/1x1.jpg?pizza=yum 197w, /1x1.png?pizza=yum 393w, http://dns/1.png?pizza=yum 600w">
  `;
  expect(subject()).toEqual(['/1x1.jpg', '/1x1.jpg', '/1x1.png']);
});

it('strips hashes in img srcset attributes', () => {
  html = `
    <img src="/1x1.jpg" srcset="/1x1.jpg#pizza 197w, /1x1.png#pizza 393w, http://dns/1.png#pizza 600w">
  `;
  expect(subject()).toEqual(['/1x1.jpg', '/1x1.jpg', '/1x1.png']);
});

it('handles invalid img srcset attributes', () => {
  html = `
    <img srcset="    ">
  `;
  expect(subject()).toEqual([]);
});

it('handles single-url img srcsets', () => {
  html = `
    <img srcset="/1x1.png">
  `;
  expect(subject()).toEqual(['/1x1.png']);
});

it('handles single-url img srcsets with external urls', () => {
  html = `
    <img srcset="http://foo/1.png">
  `;
  expect(subject()).toEqual([]);
});

it('handles img srcset with commas', () => {
  html = `
    <img srcset="/f1,2,3.png 100w, /f1,3.png 200w">
  `;
  expect(subject()).toEqual(['/f1,2,3.png', '/f1,3.png']);
});

it('handles img srcset with plenty of whitespace', () => {
  html = `
    <img srcset="
      /1x1.png    100w,
      /f1,3.png   200w"
    >
  `;
  expect(subject()).toEqual(['/1x1.png', '/f1,3.png']);
});

it('handles img srcset with multiple URLs with mixed descriptors', () => {
  html = `
    <img srcset="/1x1.png, /f1,3.png 200w">
  `;
  expect(subject()).toEqual(['/1x1.png', '/f1,3.png']);
});

it('finds assets in picture source srcset attributes', () => {
  html = `
    <picture>
      <source srcset="/wide.jpg" media="(min-width: 1000px)">
      <source srcset="/medium.jpg" media="(min-width: 700px)">
      <source srcset="/narrow.jpg">
      <img src="/medium.jpg">
    </picture>
  `;
  expect(subject()).toEqual(['/medium.jpg', '/wide.jpg', '/medium.jpg', '/narrow.jpg']);
});

it('does not find assets in audio source srcset attributes', () => {
  html = `
    <audio>
      <source srcset="/wide.jpg" media="(min-width: 1000px)">
      <source srcset="/medium.jpg" media="(min-width: 700px)">
      <source srcset="/narrow.jpg">
    </audio>
  `;
  expect(subject()).toEqual([]);
});

it('does not find assets in video source srcset attributes', () => {
  html = `
    <video>
      <source srcset="/wide.jpg" media="(min-width: 1000px)">
      <source srcset="/medium.jpg" media="(min-width: 700px)">
      <source srcset="/narrow.jpg">
    </video>
  `;
  expect(subject()).toEqual([]);
});
