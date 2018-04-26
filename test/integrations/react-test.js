import jest from 'jest';

import * as defaultConfig from '../../src/DEFAULTS';
import makeRequest from '../../src/makeRequest';
import runCommand from '../../src/commands/run';

process.on('unhandledRejection', (error) => {
  console.error(error.stack);
});

jest.mock('../../src/makeRequest');

class MockTarget {
  constructor() {
    this.viewport = '800x600';
  }

  execute({ globalCSS, snapPayloads }) {
    this.globalCSS = globalCSS;
    this.snapPayloads = snapPayloads;
    return [];
  }
}

let subject;
let config;
let sha;

beforeEach(() => {
  makeRequest.mockImplementation(() => Promise.resolve({}));
  sha = 'foobar';
  config = Object.assign({}, defaultConfig, {
    targets: { chrome: new MockTarget() },
    include: 'test/integrations/examples/*-happo.js*',
  });
  subject = () => runCommand(sha, config, {});
});

it('produces the right html', async () => {
  await subject();
  expect(config.targets.chrome.snapPayloads).toEqual([
    {
      component: 'Foo',
      css: '',
      hash: '78964407b0f7f03d2d8d61c59d631697',
      html: '<button>Click meish</button>',
      variant: 'anotherVariant',
    },
    {
      component: 'Foo',
      css: '',
      hash: 'c5bb1d5528b0f12d20b068c9f8166756',
      html: '<button>Click me</button>',
      variant: 'default',
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
