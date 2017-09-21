import fs from 'fs';
import path from 'path';

const FILE_PATH = path.join(process.cwd(), '.snapshot-sha');

export function getPreviousSha() {
  try {
    return fs.readFileSync(FILE_PATH, 'utf-8');
  } catch (e) {
    return undefined;
  }
}

export function setPreviousSha(previousSha) {
  fs.writeFileSync(FILE_PATH, previousSha);
}
