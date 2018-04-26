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
    targets: { firefox: new MockTarget() },
    include: 'test/integrations/examples/*-plain-happo.js*',
  });
  subject = () => runCommand(sha, config, {});
});

it('produces the right html', async () => {
  await subject();
  expect(config.targets.firefox.snapPayloads).toEqual([
    {
      component: 'Foo-plain',
      css: '',
      hash: '062b1e9539837eb5eea6806c2e2ec437',
      html: '<button>Click me</button>',
      variant: 'default',
    },
    {
      component: 'Foo-plain',
      css: '',
      hash: 'e8e8c114671d762a7c026425977424d0',
      html: '<button>Click meish</button>',
      variant: 'anotherVariant',
    },
  ]);
});

it('produces the right css', async () => {
  await subject();
  expect(config.targets.firefox.globalCSS).toEqual(
    'button { color: red }\nbutton { text-align: center }',
  );
});
