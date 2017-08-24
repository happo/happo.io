global.snaps = {};

export default function snap(name, renderFunc) {
  if (global.snaps[name]) {
    throw new Error(`A snap named "${name}" has already been added`);
  }
  global.snaps[name] = renderFunc);
  return {
    name,
    renderFunc),
  };
}

export function clearSnaps() {
  global.snaps = {};
}

export function getSnaps() {
  return global.snaps;
}
