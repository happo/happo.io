import getComponentNameFromFileName from '../src/getComponentNameFromFileName';

it('handles suffixed file names', () => {
  expect(getComponentNameFromFileName('./src/Button-happo.jsx')).toEqual('Button');
});

it('handles directory structures', () => {
  expect(getComponentNameFromFileName('./src/Button/happo.jsx')).toEqual('Button');
});

it('handles directory structures with unconventional names', () => {
  expect(getComponentNameFromFileName('./src/foo_bar/happo.jsx')).toEqual('foo_bar');
});

it('handles custom naming structures', () => {
  expect(getComponentNameFromFileName('./src/NavBar-examples.js')).toEqual('NavBar');
});

it('handles underscores', () => {
  expect(getComponentNameFromFileName('./src/nav_bar_examples.js')).toEqual('nav_bar');
});

it('handles files that are named index', () => {
  expect(getComponentNameFromFileName('pages/index-happo.js')).toEqual('index');
});

it('handles files that have numbers', () => {
  expect(getComponentNameFromFileName('./src/Motel6-happo.js')).toEqual('Motel6');
});

it('handles files that have dashes', () => {
  expect(getComponentNameFromFileName('./src/motel-six-happo.js')).toEqual('motel-six');
});

it('handles files that are in the root folder', () => {
  expect(getComponentNameFromFileName('./Foo-happo.jsx')).toEqual('Foo');
});
