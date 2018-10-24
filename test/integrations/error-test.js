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
    include: 'test/integrations/examples/*-error-happo.js*',
    type: 'plain',
  });
  subject = () => runCommand(sha, config, {});
});

it('throws on errors', async () => {
  try {
    await subject();
  } catch (e) {
    expect(e.message).toMatch(/Failed to render component "Foo-error"/);
    return;
  }
  // If we end up here, something is wrong
  expect(false).toBe(true);
});
