import path from 'path';

export default function testName(file) {
  // TODO must be updated to support Button-snaps.jsx
  return path.basename(path.dirname(file));
}
