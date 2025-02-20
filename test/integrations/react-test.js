import os from 'os';
import path from 'path';
import http from 'http';

import formidable from 'formidable';
import AdmZip from 'adm-zip';
import happoPluginPuppeteer from 'happo-plugin-puppeteer';

import MockTarget from './MockTarget';
import * as defaultConfig from '../../src/DEFAULTS';

let config;
const sha = 'foobar';

const subject = () => {
  // The run command has some local state (e.g. `knownAssetPackagePaths`) that
  // we want to make sure is reset between each test.
  jest.resetModules();
  const runCommand = require('../../src/commands/run').default;
  return runCommand(sha, config, {});
};

async function parseFormData(req) {
  const form = formidable({});
  const [fields, files] = await form.parse(req);
  return { fields, files };
}

function sendJson(res, data, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

let server;
let receivedRequests = [];
let mockResponses = {};

beforeEach(() => {
  mockResponses = {
    'GET /assets-data/:hash': {
      method: 'GET',
      url: /\/assets-data\/[a-f0-9]+$/,
      handler: (req, res) => {
        res.statusCode = 404;
        res.end('Not found');
      },
    },

    'GET /assets/:hash/signed-url': {
      method: 'GET',
      url: /\/assets\/[a-f0-9]+\/signed-url$/,
      handler: (req, res) => {
        sendJson(res, {
          // Normally this would be an S3 signed URL, but for testing here we
          // are using localhost so we can control the response
          signedUrl: 'http://localhost:3000/a-signed-url',
        });
      },
    },

    'PUT /a-signed-url': {
      method: 'PUT',
      url: /\/a-signed-url$/,
      handler: (req, res) => {
        res.statusCode = 200;
        res.end('OK');
      },
    },

    'POST /assets/:hash': {
      method: 'POST',
      url: /\/assets\/[a-f0-9]+$/,
      handler: async (req, res) => {
        req.formData = await parseFormData(req);
        const parts = req.url.split('/');
        const hash = parts[parts.length - 2];
        sendJson(res, {
          path: `a/1/${hash}.zip`,
          isNew: true,
        });
      },
    },

    'POST /assets/:hash/signed-url/finalize': {
      method: 'POST',
      url: /\/assets\/[a-f0-9]+\/signed-url\/finalize$/,
      handler: (req, res) => {
        const parts = req.url.split('/');
        const hash = parts[parts.length - 2];
        sendJson(res, {
          path: `a/1/${hash}.zip`,
          isNew: true,
        });
      },
    },

    'POST /api/reports/:sha': {
      method: 'POST',
      url: /\/api\/reports\/[^/]+$/,
      handler: async (req, res) => {
        req.formData = await parseFormData(req);
        sendJson(res, {});
      },
    },
  };

  // Start an HTTP server so we can serve packages
  receivedRequests = [];
  server = http.createServer(async (req, res) => {
    // Store the request for later inspection
    receivedRequests.push(req);

    const mockResponse = Object.values(mockResponses).find(
      (mockResponse) =>
        mockResponse.method === req.method && mockResponse.url.test(req.url),
    );

    if (!mockResponse) {
      sendJson(res, {});
      return;
    }

    return mockResponse.handler(req, res);
  });
  server.listen(3000);

  config = {
    ...defaultConfig,
    endpoint: 'http://localhost:3000',
    project: `the project`,
    targets: { chrome: new MockTarget() },
    include: 'test/integrations/examples/*-react-happo.js*',
    setupScript: path.resolve(__dirname, 'reactSetup.js'),
    renderWrapperModule: path.resolve(__dirname, 'renderWrapper.js'),
    stylesheets: [
      path.resolve(__dirname, 'styles.css'),
      { source: path.resolve(__dirname, 'one.css'), conditional: true, id: 'one' },
      { source: path.resolve(__dirname, 'two.css') },
    ],
    publicFolders: [path.resolve(__dirname)],
    plugins: [
      {
        pathToExamplesFile: path.resolve(__dirname, 'plugin-examples.js'),
        css: '.plugin-injected { color: red }',
      },
      {
        customizeWebpackConfig: (cfg) => {
          cfg.module.rules.push(
            {
              test: /\.ffs/,
              use: [
                {
                  loader: require.resolve('babel-loader'),
                  options: {
                    presets: [require.resolve('@babel/preset-react')],
                  },
                },
              ],
            },
            {
              loader: require.resolve('file-loader'),
              test: /\.(png|svg|jpg|gif)$/,
              options: {
                name: 'static/media/[name].[hash:8].[ext]',
                publicPath: '_/',
              },
            },
          );
          return new Promise((resolve) => {
            setTimeout(() => resolve(cfg), 50);
          });
        },
      },
    ],
    tmpdir: path.join(os.tmpdir(), 'happo-test-tmpdir'),
  };
});

afterEach(() => {
  server.close();
});

it('sends the project name when posting the report', async () => {
  await subject();

  expect(receivedRequests[2].url).toMatch(/\/api\/reports\/foobar$/);
  expect(receivedRequests[2].formData.fields.project).toEqual('the project');
});

it('produces the right html', async () => {
  await subject();
  expect(
    config.targets.chrome.snapPayloads.sort((a, b) => {
      if (a.component + a.variant < b.component + b.variant) {
        return -1;
      }
      return 1;
    }),
  ).toEqual([
    {
      component: 'Bar',
      css: '',
      html: '<div>one</div>',
      variant: 'one',
    },
    {
      component: 'Bar',
      css: '',
      html: '<div>two</div>',
      variant: 'two',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<button type="button">Click meish</button>',
      variant: 'anotherVariant',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<button type="button">Ready</button>',
      variant: 'asyncExample',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<button type="button"></button>',
      variant: 'asyncWithoutPromise',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<button>Click me</button>',
      variant: 'default',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<div>Hello world</div>',
      variant: 'dynamicImportExample',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '',
      variant: 'emptyForever',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<img alt="empty" src="_/static/media/1x1.f9992a90.png">',
      variant: 'imageExample',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<div id="happo-root" data-happo-ignore="true"><div>Outside portal</div></div><div>Inside portal</div>',
      variant: 'innerPortal',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<button type="button">I am in a portal</button>',
      variant: 'portalExample',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<div>Loaded</div>',
      variant: 'rafExample',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<div>Not loaded</div>',
      variant: 'rafUnmountExample',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<button type="button">I am dark</button>',
      variant: 'themedExample',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<button type="button">I am dark</button>',
      variant: 'themedExampleAsync',
    },
    {
      component: 'Generated',
      css: '',
      html: '<button type="button">Four</button>',
      variant: '_four',
    },
    {
      component: 'Generated',
      css: '',
      html: '<button type="button">One</button>',
      variant: 'one',
      stylesheets: ['one'],
    },
    {
      component: 'Generated',
      css: '',
      html: '<button type="button">Three</button>',
      variant: 'three',
    },
    {
      component: 'Generated',
      css: '',
      html: '<button type="button">Two</button>',
      variant: 'two',
      stylesheets: ['two'],
    },
    {
      component: 'Plugin-Component',
      css: '',
      html: '<div>Hello world</div>',
      variant: 'pluginVariantOne',
    },
  ]);
});

xdescribe('with the puppeteer plugin', () => {
  beforeEach(() => {
    config.plugins.push(
      happoPluginPuppeteer({
        launchOptions: { args: ['--no-sandbox', '--user-agent=happo-puppeteer'] },
      }),
    );
  });

  it('produces the right number of snaps', async () => {
    await subject();
    expect(config.targets.chrome.snapPayloads.length).toBe(20);
  });
});

describe('with multiple targets', () => {
  beforeEach(() => {
    config.targets.chromeSmall = new MockTarget({ viewport: '320x768' });
  });

  it('produces the right number of snaps in each target', async () => {
    await subject();
    expect(config.targets.chrome.snapPayloads.length).toBe(20);
    expect(config.targets.chromeSmall.snapPayloads.length).toBe(20);
  });
});

it('resolves assets correctly', async () => {
  await subject();
  const zipLocation = receivedRequests[1].formData.files.payload[0].filepath;
  const zip = new AdmZip(zipLocation);
  expect(zip.getEntries().map(({ entryName }) => entryName)).toEqual([
    'assets/one.jpg',
  ]);
});

it('produces the right css', async () => {
  await subject();
  expect(config.targets.chrome.globalCSS[0]).toEqual({
    css: expect.stringMatching(/\.a \{\s*b: c;\s*}\n/),
    source: path.resolve(__dirname, 'styles.css'),
  });
  expect(config.targets.chrome.globalCSS[1]).toEqual({
    id: 'one',
    conditional: true,
    source: path.resolve(__dirname, 'one.css'),
    css: `button {
  background-image: url(assets/one.jpg);
  border: 2px solid black;
  border-radius: 5px;
}
`,
  });
  expect(config.targets.chrome.globalCSS[2]).toEqual({
    css: `button {
  background-color: green;
  color: white;
}
`,
    source: path.resolve(__dirname, 'two.css'),
  });
  expect(config.targets.chrome.globalCSS[3]).toEqual({
    css: '.plugin-injected { color: red }',
  });
  expect(config.targets.chrome.globalCSS[4].css).toMatch(
    'button {text-align: center;}',
  );
  expect(config.targets.chrome.globalCSS[4].css).toMatch('button { color: red }');
});

it('works with prerender=false', async () => {
  config.prerender = false;
  config.publicFolders = [path.resolve(__dirname, 'assets'), config.tmpdir];
  await subject();
  expect(config.targets.chrome.globalCSS).toEqual([
    {
      css: expect.stringMatching(/\.a \{\s*b: c;\s*}\n/),
      source: path.resolve(__dirname, 'styles.css'),
    },
    {
      id: 'one',
      conditional: true,
      source: path.resolve(__dirname, 'one.css'),
      css: `button {
  background-image: url(assets/one.jpg);
  border: 2px solid black;
  border-radius: 5px;
}
`,
    },
    {
      css: `button {
  background-color: green;
  color: white;
}
`,
      source: path.resolve(__dirname, 'two.css'),
    },
    { css: '.plugin-injected { color: red }' },
  ]);

  const zipLocation = receivedRequests[1].formData.files.payload[0].filepath;
  const zip = new AdmZip(zipLocation);
  expect(
    zip
      .getEntries()
      .map(({ entryName }) => entryName)
      .sort(),
  ).toEqual([
    'happo-bundle.js',
    'happo-bundle.js.map',
    'happo-entry.js',
    'iframe.html',
    'index.html',
    'one.jpg',
    'static/media/1x1.f9992a90.png',
  ]);
  // require('fs').writeFileSync('staticPackage.zip',
  //   Buffer.from(config.targets.chrome.staticPackage, 'base64'));
});

describe('when HAPPO_SIGNED_URL is set', () => {
  beforeEach(() => {
    process.env.HAPPO_SIGNED_URL = 'true';
  });

  afterEach(() => {
    delete process.env.HAPPO_SIGNED_URL;
  });

  it('uploads assets to the signed URL', async () => {
    await subject();

    expect(receivedRequests[0].method).toBe('GET');
    expect(receivedRequests[0].url).toMatch(/\/assets\/[a-f0-9]+\/signed-url$/);

    expect(receivedRequests[1].method).toBe('PUT');
    expect(receivedRequests[1].url).toMatch(/\/a-signed-url$/);

    expect(receivedRequests[2].method).toBe('POST');
    expect(receivedRequests[2].url).toMatch(
      /\/assets\/[a-f0-9]+\/signed-url\/finalize$/,
    );

    // The request after the asset has been finalized is posting the report
    expect(receivedRequests[3].method).toBe('POST');
    expect(receivedRequests[3].url).toEqual('/api/reports/foobar');

    expect(receivedRequests.length).toBe(4);
  });

  describe('when the asset has already been uploaded', () => {
    beforeEach(() => {
      mockResponses['GET /assets/:hash/signed-url'] = {
        method: 'GET',
        url: /\/assets\/[a-f0-9]+\/signed-url$/,
        handler: (req, res) => {
          sendJson(res, {
            path: 'a/123.zip',
            isNew: false,
          });
        },
      };
    });

    it('does not upload or finalize the asset again', async () => {
      await subject();

      expect(receivedRequests[0].method).toBe('GET');
      expect(receivedRequests[0].url).toMatch(/\/assets\/[a-f0-9]+\/signed-url$/);

      // The request after the asset has been finalized is posting the report
      expect(receivedRequests[1].method).toBe('POST');
      expect(receivedRequests[1].url).toEqual('/api/reports/foobar');

      expect(receivedRequests.length).toBe(2);
    });
  });

  describe('when the signed URL 500s the first time', () => {
    beforeEach(() => {
      let counter = 0;
      mockResponses['PUT /a-signed-url'] = {
        method: 'PUT',
        url: /\/a-signed-url$/,
        handler: (req, res) => {
          counter++;
          if (counter === 1) {
            res.statusCode = 500;
            res.end('Internal Server Error');
          } else {
            res.statusCode = 200;
            res.end('OK');
          }
        },
      };
    });

    it('retries the request and proceeds', async () => {
      await expect(subject()).resolves.not.toThrow();

      expect(receivedRequests[0].method).toBe('GET');
      expect(receivedRequests[0].url).toMatch(/\/assets\/[a-f0-9]+\/signed-url$/);

      expect(receivedRequests[1].method).toBe('PUT');
      expect(receivedRequests[1].url).toMatch(/\/a-signed-url$/);

      expect(receivedRequests[2].method).toBe('PUT');
      expect(receivedRequests[2].url).toMatch(/\/a-signed-url$/);

      expect(receivedRequests[3].method).toBe('POST');
      expect(receivedRequests[3].url).toMatch(
        /\/assets\/[a-f0-9]+\/signed-url\/finalize$/,
      );

      // The request after the asset has been finalized is posting the report
      expect(receivedRequests[4].method).toBe('POST');
      expect(receivedRequests[4].url).toEqual('/api/reports/foobar');

      expect(receivedRequests.length).toBe(5);
    });
  });

  describe('when the signed URL 500s lots of times', () => {
    beforeEach(() => {
      mockResponses['PUT /a-signed-url'] = {
        method: 'PUT',
        url: /\/a-signed-url$/,
        handler: (req, res) => {
          res.statusCode = 500;
          res.end('Internal Server Error');
        },
      };
    });

    it('retries the request a few times and then throws', async () => {
      await expect(subject()).rejects.toThrow(
        'Failed to upload assets to S3 signed URL',
      );

      expect(receivedRequests[0].method).toBe('GET');
      expect(receivedRequests[0].url).toMatch(/\/assets\/[a-f0-9]+\/signed-url$/);

      expect(receivedRequests[1].method).toBe('PUT');
      expect(receivedRequests[1].url).toMatch(/\/a-signed-url$/);

      expect(receivedRequests[2].method).toBe('PUT');
      expect(receivedRequests[2].url).toMatch(/\/a-signed-url$/);

      expect(receivedRequests[3].method).toBe('PUT');
      expect(receivedRequests[3].url).toMatch(/\/a-signed-url$/);

      expect(receivedRequests[4].method).toBe('PUT');
      expect(receivedRequests[4].url).toMatch(/\/a-signed-url$/);

      expect(receivedRequests.length).toBe(5);
    }, 20000);
  });
});
