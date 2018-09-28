import { JSDOM } from 'jsdom';

export default class JSDOMDomProvider {
  constructor(jsdomOptions, { width, height, webpackBundle }) {
    this.dom = new JSDOM(
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
  }

  init() {
    return new Promise((resolve) => {
      this.dom.window.onBundleReady = resolve;
    });
  }

  next() {
    return this.dom.window.happoProcessor.next();
  }

  processCurrent() {
    return this.dom.window.happoProcessor.processCurrent();
  }

  extractCSS() {
    return this.dom.window.happoProcessor.extractCSS();
  }

  close() {
    this.dom.window.close();
  }
}
