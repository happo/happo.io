import inlineCSSResources from './inlineCSSResources';
import inlineResources from './inlineResources';

export default async function processSnapsInBundle(
  webpackBundle,
  { globalCSS, publicFolders, viewport, DomProvider },
) {
  const [width, height] = viewport.split('x').map((s) => parseInt(s, 10));
  const domProvider = new DomProvider({
    webpackBundle,
    width,
    height,
  });

  const result = {
    snapPayloads: [],
  };
  try {
    await domProvider.init();

    // Disabling eslint here because we actually want to run things serially.
    /* eslint-disable no-await-in-loop */
    while (await domProvider.next()) {
      const payloads = await domProvider.processCurrent();
      payloads.forEach((payload) => {
        if (payload.html && publicFolders && publicFolders.length) {
          payload.html = inlineResources(payload.html, { publicFolders });
        }
      });
      result.snapPayloads.push(...payloads);
    }

    const domCSS = await domProvider.extractCSS();
    result.globalCSS = inlineCSSResources(globalCSS + domCSS, { publicFolders });
  } catch (e) {
    throw e;
  } finally {
    await domProvider.close();
  }
  return result;
}
