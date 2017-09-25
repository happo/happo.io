import requireRelative from 'require-relative';

export default function loadUserConfig() {
  try {
    return requireRelative('./.happo.js', process.cwd());
  } catch (e) {
    if (e.message && /Cannot find.*\.happo\.js/.test(e.message)) {
      return {};
    }
    throw new Error(e);
  }
}
