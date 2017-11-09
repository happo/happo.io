import queued from '../src/queued';

it('returns items in order', async () => {
  const result = await queued([1, 2, 3], (num) => Promise.resolve(`num=${num}`));
  expect(result).toEqual([
    'num=1',
    'num=2',
    'num=3',
  ]);
});

it('rejects when one fails', async () => {
  try {
    const result = await queued([1, 2, 3], () => Promise.reject(new Error('foo')));
    expect(true).toBe(false); // shouldn't be here
  } catch (e) {
    expect(e.message).toEqual('foo');
  }
});

it('handles empty arrays', async () => {
  const result = await queued([], () => Promise.resolve());
  expect(result).toEqual([]);
});
