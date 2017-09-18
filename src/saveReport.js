import fs from 'fs';
import path from 'path';

const pathToSnapshotsFile = path.join(process.cwd(), '__snapshots.json');

export { pathToSnapshotsFile };

export default function saveCurrentSnapshots(snapshots) {
  return new Promise((resolve, reject) => {
    fs.writeFile(pathToSnapshotsFile, JSON.stringify(snapshots, null, 2), (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}
