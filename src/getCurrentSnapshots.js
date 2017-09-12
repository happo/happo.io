import { pathToSnapshotsFile } from './saveCurrentSnapshots';

export default function getCurrentSnapshots() {
  try {
    return require(pathToSnapshotsFile);
  } catch (error) {
    return {};
  }
}
