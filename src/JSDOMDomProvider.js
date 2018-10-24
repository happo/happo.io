import { JSDOM, VirtualConsole } from 'jsdom';

const { VERBOSE } = process.env;

const MAX_ERROR_DETAIL_LENGTH = 200;

export default class JSDOMDomProvider {
  constructor(jsdomOptions, { width, height, webpackBundle }) {
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', (e) => {
      const len = e.detail.length;
      if (VERBOSE || len < MAX_ERROR_DETAIL_LENGTH) {
        console.error(e.stack, e.detail);
      } else {
        const newDetail = `${(e.detail || '').slice(0, MAX_ERROR_DETAIL_LENGTH)}...
          To see the full error, run happo with "VERBOSE=true")`;
        console.error(e.stack, newDetail);
      }
    });
    virtualConsole.sendTo(console, { omitJSDOMErrors: true });

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
          virtualConsole,
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
