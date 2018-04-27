import commander from 'commander';

import executeCli from '../src/executeCli';

beforeEach(() => {
  commander.help = jest.fn();
});

it('displays help when no command is given', () => {
  executeCli(['node', 'happo']);
  expect(commander.help.mock.calls.length).toBe(1);
});
