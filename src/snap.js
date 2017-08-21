let snaps = {};

export default function snap(name, jsx) {
  if (snaps[name]) {
    throw new Error(`A snap named "${name}" has already been added`);
  }
  snaps[name] = jsx;
  return {
    name,
    jsx,
  };
}

export function clearSnaps() {
  snaps = {};
}

export function getSnaps() {
  return snaps;
}
