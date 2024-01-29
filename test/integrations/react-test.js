import os from 'os';
import path from 'path';

import AdmZip from 'adm-zip';
import happoPluginPuppeteer from 'happo-plugin-puppeteer';

import MockTarget from './MockTarget';
import * as defaultConfig from '../../src/DEFAULTS';
import makeRequest from '../../src/makeRequest';
import runCommand from '../../src/commands/run';

jest.mock('../../src/makeRequest');

let subject;
let config;
let sha;

beforeEach(() => {
  makeRequest.mockImplementation((req) => {
    if (/\/assets\//.test(req.url) && req.method === 'POST') {
      // uploading assets
      return Promise.resolve({ path: req.formData.payload.value, uploadedAt: new Date() });
    }
    if (/\/assets-data\//.test(req.url) && req.method === 'GET') {
      // checking if assets exist
      const e = new Error();
      e.statusCode = 404;
      throw e;
    }
    return Promise.resolve({});
  });
  sha = 'foobar';
  config = Object.assign({}, defaultConfig, {
    project: 'the project',
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
          cfg.module.rules.push({
            test: /\.ffs/,
            use: [
              {
                loader: require.resolve('babel-loader'),
                options: {
                  presets: [require.resolve('@babel/preset-react')],
                },
              },
            ],
          });
          cfg.module.rules.push({
            loader: require.resolve('file-loader'),
            test: /\.(png|svg|jpg|gif)$/,
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
              publicPath: '_/',
            },
          });
          return new Promise((resolve) => setTimeout(() => resolve(cfg), 50));
        },
      },
    ],
    tmpdir: path.join(os.tmpdir(), 'happo-test-tmpdir'),
  });
  subject = () => runCommand(sha, config, {});
});

it('sends the project name in the request', async () => {
  await subject();
  expect(makeRequest.mock.calls[2][0].body.project).toEqual('the project');
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
      html: '<button>Click meish</button>',
      variant: 'anotherVariant',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<button>Ready</button>',
      variant: 'asyncExample',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<button></button>',
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
      html:
        '<div id="happo-root" data-happo-ignore="true"><div>Outside portal</div></div><div>Inside portal</div>',
      variant: 'innerPortal',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<button>I am in a portal</button>',
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
      html: '<button>I am dark</button>',
      variant: 'themedExample',
    },
    {
      component: 'Foo-react',
      css: '',
      html: '<button>I am dark</button>',
      variant: 'themedExampleAsync',
    },
    {
      component: 'Generated',
      css: '',
      html: '<button>Four</button>',
      variant: '_four',
    },
    {
      component: 'Generated',
      css: '',
      html: '<button>One</button>',
      variant: 'one',
      stylesheets: ['one'],
    },
    {
      component: 'Generated',
      css: '',
      html: '<button>Three</button>',
      variant: 'three',
    },
    {
      component: 'Generated',
      css: '',
      html: '<button>Two</button>',
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
  const zip = new AdmZip(config.targets.chrome.assetsPackage);
  expect(zip.getEntries().map(({ entryName }) => entryName)).toEqual([
    'assets/one.jpg',
  ]);
});

it('produces the right css', async () => {
  await subject();
  expect(config.targets.chrome.globalCSS[0]).toEqual(
    {
      css: '.a { b: c }\n',
      source: path.resolve(__dirname, 'styles.css'),
    },
  );
  expect(config.targets.chrome.globalCSS[1]).toEqual(
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
  );
  expect(config.targets.chrome.globalCSS[2]).toEqual(
    {
      css: `button {
  background-color: green;
  color: white;
}
`,
      source: path.resolve(__dirname, 'two.css'),
    },
  );
  expect(config.targets.chrome.globalCSS[3]).toEqual(
    { css: '.plugin-injected { color: red }' },
  );
  expect(config.targets.chrome.globalCSS[4].css).toMatch('button {text-align: center;}');
  expect(config.targets.chrome.globalCSS[4].css).toMatch('button { color: red }');
});

it('works with prerender=false', async () => {
  config.prerender = false;
  config.publicFolders = [path.resolve(__dirname, 'assets'), config.tmpdir];
  await subject();
  expect(config.targets.chrome.globalCSS).toEqual([
    {
      css: '.a { b: c }\n',
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

  const zip = new AdmZip(config.targets.chrome.staticPackage);
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
    'static/',
    'static/media/',
    'static/media/1x1.f9992a90.png',
  ]);
  // require('fs').writeFileSync('staticPackage.zip',
  //   Buffer.from(config.targets.chrome.staticPackage, 'base64'));
});
