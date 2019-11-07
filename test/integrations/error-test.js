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

describe('with a syntax error', () => {
  beforeEach(() => {
    config.include = 'test/integrations/examples/*-error-syntax-happo.js*';
    config.type = 'react';
  });

  it('throws an error', async () => {
    try {
      await subject();
    } catch (e) {
      expect(e.message).toMatch(
        /Module build failed/,
      );
      return;
    }

    console.log(config.targets.firefox.snapPayloads);

    // If we end up here, something is wrong
    expect(false).toBe(true);
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

  describe('with the puppeteer plugin', () => {
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
