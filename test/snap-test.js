import snap, { clearSnaps, getSnaps } from '../src/snap';

beforeEach(() => {
  clearSnaps();
});

it('registers multiple snaps', () => {
  snap('foo', 'element');
  snap('bar', 'another element');
  expect(Object.keys(getSnaps()).length).toBe(2);
});

it('prevents adding duplicate snaps', () => {
  expect(() => {
    snap('foo', 'element');
    snap('foo', 'another element');
  }).toThrowError(/has already been added/);
});
