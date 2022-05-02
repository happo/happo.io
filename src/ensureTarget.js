import RemoteBrowserTarget from './RemoteBrowserTarget';

export default function ensureTarget(targetOrObject) {
  if (typeof targetOrObject.execute === 'function') {
    return targetOrObject;
  }
  return new RemoteBrowserTarget(targetOrObject.browserType, targetOrObject);
}
