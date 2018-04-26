import fs from 'fs';
import path from 'path';

export default function fileToBase64(src, { publicFolders }) {
  for (const folder of publicFolders) {
    const pathToFile = path.join(folder, src);
    if (fs.existsSync(pathToFile)) {
      const base64 = Buffer.from(fs.readFileSync(pathToFile)).toString('base64');
      const extension = path.extname(pathToFile);
      let mime = extension.replace(/\./, 'image/');
      if (extension === '.svg') {
        mime = `${mime}+xml`;
      }
      return `data:${mime};charset=utf-8;base64,${base64}`;
    }
  }
}
