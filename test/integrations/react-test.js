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
  makeRequest.mockImplementation(() => Promise.resolve({}));
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
                  presets: [require.resolve('babel-preset-react')],
                },
              },
            ],
          });
          return new Promise((resolve) => setTimeout(() => resolve(cfg), 50));
        },
      },
    ],
  });
  subject = () => runCommand(sha, config, {});
});

it('sends the project name in the request', async () => {
  await subject();
  expect(makeRequest.mock.calls[0][0].body.project).toEqual('the project');
});

it('produces the right html', async () => {
  await subject();
  expect(config.targets.chrome.snapPayloads).toEqual([
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
      html: '<button>I am in a portal</button>',
      variant: 'portalExample',
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
      html: '',
      variant: 'emptyForever',
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
      html: '<button>Click me</button>',
      variant: 'default',
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
      html: '<button>Two</button>',
      variant: 'two',
      stylesheets: ['two'],
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
      html: '<button>Four</button>',
      variant: '_four',
    },
    {
      component: 'Plugin-Component',
      css: '',
      html: '<div>Hello world</div>',
      variant: 'pluginVariantOne',
    },
  ]);
});

describe('with the puppeteer plugin', () => {
  beforeEach(() => {
    config.plugins.push(
      happoPluginPuppeteer({
        launchOptions: { args: ['--no-sandbox', '--user-agent=happo-puppeteer'] },
      }),
    );
  });

  it('produces the right number of snaps', async () => {
    await subject();
    expect(config.targets.chrome.snapPayloads.length).toBe(18);
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
    {
      css: `button {text-align: center;}
button { color: red }`,
    },
  ]);
});

it('works with prerender=false', async () => {
  config.prerender = false;
  config.publicFolders = [path.resolve(__dirname, 'assets')];
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
  expect(zip.getEntries().map(({ entryName }) => entryName)).toEqual([
    'happo-bundle.js',
    'iframe.html',
    'test/integrations/assets/one.jpg',
  ]);
  // require('fs').writeFileSync('staticPackage.zip',
  //   Buffer.from(config.targets.chrome.staticPackage, 'base64'));
});
