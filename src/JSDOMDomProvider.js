import { JSDOM, VirtualConsole } from 'jsdom';
import mergeJsdomOptions from './mergeJSDOMOptions';

const { VERBOSE, HAPPO_BUNDLE_LOAD_TIMEOUT_MS: rawBundleLoadTimeout = '60000' } =
  process.env;

const HAPPO_BUNDLE_LOAD_TIMEOUT_MS = parseInt(rawBundleLoadTimeout, 10);

const MAX_ERROR_DETAIL_LENGTH = 200;

export default class JSDOMDomProvider {
  constructor(jsdomOptions, { width, height, webpackBundle }) {
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', (e) => {
      const { stack, detail = '' } = e;
      if (
        VERBOSE ||
        typeof detail !== 'string' ||
        detail.length < MAX_ERROR_DETAIL_LENGTH
      ) {
        console.error(stack, detail);
      } else {
        const newDetail = `${(detail || '').slice(0, MAX_ERROR_DETAIL_LENGTH)}...
          To see the full error, run happo with "VERBOSE=true")`;
        console.error(stack, newDetail);
      }
    });
    virtualConsole.sendTo(console, { omitJSDOMErrors: true });

    const defaultJsdomOptions = {
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
        win.cancelAnimationFrame = clearTimeout;
      },
    };

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
      mergeJsdomOptions(defaultJsdomOptions, jsdomOptions),
    );
  }

  async init({ targetName }) {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () =>
          reject(
            new Error(
              `Failed to load Happo bundle within ${HAPPO_BUNDLE_LOAD_TIMEOUT_MS}ms. Check console log for errors.`,
            ),
          ),
        HAPPO_BUNDLE_LOAD_TIMEOUT_MS,
      );

      this.dom.window.onBundleReady = () => {
        clearTimeout(timeout);
        resolve();
      };
    });
    return this.dom.window.happoProcessor.init({ targetName });
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
