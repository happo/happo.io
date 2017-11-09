export default async function queued(array, handler, i = 0) {
  if (i === array.length) {
    return [];
  }
  const item = await handler(array[i]);
  const items = await queued(array, handler, i + 1);
  return [item].concat(items);
}
