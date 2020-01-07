import { execSync } from 'child_process';

const happoCommand = require.resolve('../build/cli');

it('displays help when no command is given', () => {
  const result = execSync(happoCommand, { encoding: 'utf-8' });
  expect(result).toMatch(/^Usage: /);
});
