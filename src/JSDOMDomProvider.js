import { JSDOM, VirtualConsole } from 'jsdom';

import Logger from './Logger';

const { VERBOSE } = process.env;

const MAX_ERROR_DETAIL_LENGTH = 200;

// Cache the JSDOM instance because re-loading the webpack bundle for every
// target can be very expensive. This assumes that jsdomOptions and
// webpackBundle do not change.
let dom;
function getCachedDOM(jsdomOptions, webpackBundle) {
  if (!dom) {
    const logger = new Logger();
    logger.start('Initializing JSDOM with the bundle...');

    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', (e) => {
      const { stack, detail = '' } = e;
      if (VERBOSE || typeof detail !== 'string' || detail.length < MAX_ERROR_DETAIL_LENGTH) {
        console.error(stack, detail);
      } else {
        const newDetail = `${(detail || '').slice(0, MAX_ERROR_DETAIL_LENGTH)}...
          To see the full error, run happo with "VERBOSE=true")`;
        console.error(stack, newDetail);
      }
    });
    virtualConsole.sendTo(console, { omitJSDOMErrors: true });

    dom = new JSDOM(
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
            win.requestAnimationFrame = (callback) => setTimeout(callback, 0);
            win.cancelAnimationFrame = clearTimeout;
          },
        },
        jsdomOptions,
      ),
    );

    logger.success();
  }

  return dom;
}

// Useful for tests
export function clearCachedDOM() {
  dom = undefined;
}

export default class JSDOMDomProvider {
  constructor(jsdomOptions, { webpackBundle }) {
    this.dom = getCachedDOM(jsdomOptions, webpackBundle);
  }

  async init({ targetName }) {
    await new Promise((resolve) => {
      this.dom.window.onBundleReady = resolve;
    });
    return this.dom.window.happoProcessor.init({ targetName });
  }

  resize({ width, height }) {
    this.dom.window.outerWidth = this.dom.window.innerWidth = width;
    this.dom.window.outerHeight = this.dom.window.innerHeight = height;
    Object.defineProperties(this.dom.window.screen, {
      width: { value: width, configurable: true },
      availWidth: { value: width, configurable: true },
      height: { value: height, configurable: true },
      availHeight: { value: height, configurable: true },
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
