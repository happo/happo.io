import happoPluginPuppeteer from 'happo-plugin-puppeteer';

import MockTarget from './MockTarget';
import * as defaultConfig from '../../src/DEFAULTS';
import makeRequest from '../../src/makeRequest';
import runCommand from '../../src/commands/run';

jest.mock('../../src/makeRequest');
jest.setTimeout(30000);

const originalConsoleWarn = console.warn;
const originalConsoleErr = console.error;
const originalConsoleLog = console.log;

let subject;
let config;
let sha;

beforeEach(() => {
  console.warn = jest.fn(originalConsoleWarn);
  console.error = jest.fn(originalConsoleErr);
  console.log = jest.fn(originalConsoleLog);
  console.error.mockReset();
  console.warn.mockReset();
  console.log.mockReset();
  makeRequest.mockImplementation(() => Promise.resolve({}));
  sha = 'foobar';
  config = Object.assign({}, defaultConfig, {
    targets: { firefox: new MockTarget() },
    include: 'test/integrations/examples/*-error-happo.js*',
    type: 'plain',
  });
  subject = () => runCommand(sha, config, {});
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleErr;
  console.log = originalConsoleLog;
});

it('throws on errors in example functions', async () => {
  try {
    await subject();
  } catch (e) {
    expect(e.message).toMatch(/Failed to render component "Foo-error"/);
    return;
  }
  // If we end up here, something is wrong
  expect(false).toBe(true);
});

describe('with a component that throws when rendered', () => {
  beforeEach(() => {
    config.include = 'test/integrations/examples/*-error-throws-on-render-happo.js*';
    config.type = 'react';
  });

  it('logs the error and moves on', async () => {
    await subject();
    expect(console.error.mock.calls.length).toBe(5);
    expect(console.error.mock.calls[3][0]).toEqual(
      'Caught error while rendering component "Foo-error-throws-on-render", variant "default"',
    );
  });
});

describe('with a syntax error', () => {
  beforeEach(() => {
    config.include = 'test/integrations/examples/*-error-syntax-happo.js*';
    config.type = 'react';
  });

  it('throws an error', async () => {
    try {
      await subject();
    } catch (e) {
      expect(e.message).toMatch(/Module build failed/);
      return;
    }

    console.log(config.targets.firefox.snapPayloads);

    // If we end up here, something is wrong
    expect(false).toBe(true);
  });
});

describe('with an empty list of examples', () => {
  beforeEach(() => {
    config.include = 'test/integrations/examples/*-error-empty-happo.js*';
    config.type = 'react';
  });

  it('logs a warning', async () => {
    await subject();
    expect(console.warn.mock.calls).toEqual([
      ['No examples found for target firefox, skipping'],
    ]);
  });
});

describe('with a misconfigured file', () => {
  beforeEach(() => {
    config.include = 'test/integrations/examples/*-error-misconfigured-happo.js*';
    config.type = 'react';
  });

  it('throws an error', async () => {
    try {
      await subject();
    } catch (e) {
      expect(e.message).toMatch(
        /Variant bar in component Foo-error-misconfigured has no render function/,
      );
      return;
    }

    console.log(config.targets.firefox.snapPayloads);

    // If we end up here, something is wrong
    expect(false).toBe(true);
  });

  xdescribe('with the puppeteer plugin', () => {
    beforeEach(() => {
      config.plugins = [happoPluginPuppeteer()];
    });

    it('throws an error', async () => {
      try {
        await subject();
      } catch (e) {
        expect(e.message).toMatch(
          /Variant bar in component Foo-error-misconfigured has no render function/,
        );
        return;
      }

      console.log(config.targets.firefox.snapPayloads);

      // If we end up here, something is wrong
      expect(false).toBe(true);
    });
  });
});

describe('with generated examples that fail to initialize', () => {
  beforeEach(() => {
    config.include = 'test/integrations/examples/*-error-generated-happo.js*';
    config.type = 'react';
  });

  it('throws a timeout error', async () => {
    try {
      await subject();
    } catch (e) {
      expect(e.message).toMatch(
        /Failed to load Happo bundle within/,
      );
      expect(console.error.mock.calls[1][0]).toMatch(/foo is not defined/);
      return;
    }


    // If we end up here, something is wrong
    expect(false).toBe(true);
  });
});
