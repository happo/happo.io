import executeCli from '../src/executeCli';

import commander from 'commander';

beforeEach(() => {
  commander.help = jest.fn();
});

it('displays help when no command is given', () => {
  executeCli(['node', 'happo']);
  expect(commander.help.mock.calls.length).toBe(1);
});
