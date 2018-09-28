import { JSDOM } from 'jsdom';

import inlineCSSResources from './inlineCSSResources';
import inlineResources from './inlineResources';

export default async function processSnapsInBundle(
  webpackBundle,
  { globalCSS, publicFolders, viewport, jsdomOptions },
) {
  const [width, height] = viewport.split('x').map((s) => parseInt(s, 10));
  const dom = new JSDOM(
    `
      <!DOCTYPE html>
      <html>
        <head>
          <script src='file://${webpackBundle}'></script>
        </head>
        <body>
        </body>
      </html>
    `.trim(),
    Object.assign(
      {
        runScripts: 'dangerously',
        resources: 'usable',
        url: 'http://localhost',
        beforeParse(win) {
          win.outerWidth = win.innerWidth = width;
          win.outerHeight = win.innerHeight = height;
          Object.defineProperties(win.screen, {
            width: { value: width },
            availWidth: { value: width },
            height: { value: height },
            availHeight: { value: height },
          });
          win.requestAnimationFrame = (callback) => setTimeout(callback, 0);
          win.cancelAnimationFrame = () => {};
        },
      },
      jsdomOptions,
    ),
  );

  await new Promise((resolve) => {
    dom.window.onBundleReady = resolve;
  });

  const result = {
    snapPayloads: [],
  };

  const processor = dom.window.happoProcessor;

  while (processor.next()) {
    // Disabling eslint here because we actually want to run things serially.
    // eslint-disable-next-line no-await-in-loop
    const payloads = await processor.processCurrent();
    payloads.forEach((payload) => {
      if (payload.html && publicFolders && publicFolders.length) {
        payload.html = inlineResources(payload.html, { publicFolders });
      }
    });
    result.snapPayloads.push(...payloads);
  }
  result.globalCSS = inlineCSSResources(globalCSS + processor.extractCSS(), { publicFolders });
  dom.window.close();
  return result;
}
