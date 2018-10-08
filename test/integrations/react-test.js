import path from 'path';

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
    targets: { chrome: new MockTarget() },
    include: 'test/integrations/examples/*-react-happo.js*',
    setupScript: path.resolve(__dirname, 'reactSetup.js'),
    renderWrapperModule: path.resolve(__dirname, 'renderWrapper.js'),
    plugins: [
      {
        pathToExamplesFile: path.resolve(__dirname, 'plugin-examples.js'),
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
      html: '<button>Click me</button>',
      variant: 'default',
    },
    {
      component: 'Plugin-Component',
      css: '',
      html: '<div>Hello world</div>',
      variant: 'pluginVariantOne',
    },
  ]);
});

it('produces the right css', async () => {
  await subject();
  expect(config.targets.chrome.globalCSS).toEqual(
    `
   button { text-align: center }\nbutton { color: red }
    `.trim(),
  );
});
