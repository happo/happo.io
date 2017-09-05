import requireRelative from 'require-relative';

export default function loadUserConfig() {
  try {
    return requireRelative('./.enduire.js', process.cwd());
  } catch (e) {
    if (e.message && /Cannot find.*\.enduire\.js/.test(e.message)) {
      return {};
    }
    throw new Error(e);
  }
}
