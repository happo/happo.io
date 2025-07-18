const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const core = require('@actions/core');

const checkMajorBump = require('..');
const tmpfs = require('./tmpfs');

// Mock only the @actions/core module
jest.mock('@actions/core');

// Helper function to set up the Git repo *within* the mocked temp directory
const setupGitRepo = (initialFiles, updatedFiles) => {
  // Assumes we are already inside the temp directory via tmpfs.mock()

  // Initialize Git repo
  execSync('git init -b main');
  execSync('git config user.email "test@example.com"');
  execSync('git config user.name "Test User"');

  // Create initial files and commit
  Object.entries(initialFiles).forEach(([filePath, content]) => {
    const dir = path.dirname(filePath);
    if (dir !== '.') {
      fs.mkdirSync(dir, { recursive: true }); // Create subdirs as needed
    }

    fs.writeFileSync(filePath, content);
  });

  execSync('git add .');
  execSync('git commit -m "Initial commit"');

  const baseSha = execSync('git rev-parse HEAD').toString().trim();
  process.env.GITHUB_BASE_SHA = baseSha; // Set env var for the script

  // Create or update files for the second commit
  Object.entries(updatedFiles).forEach(([filePath, content]) => {
    const dir = path.dirname(filePath);
    if (dir !== '.' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
  });

  execSync('git add .');
  execSync('git commit -m "Update dependencies" --allow-empty');
};

const originalEnv = process.env;

beforeEach(() => {
  // Reset environment and mocks
  process.env = { ...originalEnv };
  jest.clearAllMocks();

  // Setup temporary directory (no initial files needed here, setupGitRepo handles them)
  tmpfs.mock({});
});

afterEach(() => {
  // Restore environment and cleanup temp directory
  tmpfs.restore();
  process.env = originalEnv;
});

it('outputs false when no dependencies change', async () => {
  const initialPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      version: '1.0.0',
      dependencies: {
        react: '^17.0.1',
      },
    },
    null,
    2,
  );

  // setupGitRepo writes files relative to the temp dir created by tmpfs.mock
  setupGitRepo(
    { 'package.json': initialPkgJson },
    { 'package.json': initialPkgJson },
  );

  await checkMajorBump();

  expect(core.setOutput).toHaveBeenCalledWith('contains_major_bump', 'false');
  expect(core.setFailed).not.toHaveBeenCalled();
  expect(core.warning).not.toHaveBeenCalled();
});

it('outputs false for minor bumps', async () => {
  const initialPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      dependencies: {
        react: '^17.0.1',
        lodash: '~4.17.20',
      },
    },
    null,
    2,
  );

  const updatedPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      dependencies: {
        react: '^17.0.2',
        lodash: '~4.17.21',
      },
    },
    null,
    2,
  );

  setupGitRepo(
    { 'package.json': initialPkgJson },
    { 'package.json': updatedPkgJson },
  );

  await checkMajorBump();

  expect(core.setOutput).toHaveBeenCalledWith('contains_major_bump', 'false');
  expect(core.setFailed).not.toHaveBeenCalled();
  expect(core.warning).not.toHaveBeenCalled();
});

it('outputs true for a standard major bump in top-level package.json (1.x -> 2.x)', async () => {
  const initialPkgJson = JSON.stringify(
    {
      name: 'lib-a',
      dependencies: {
        'some-dep': '^1.5.0',
      },
    },
    null,
    2,
  );

  const updatedPkgJson = JSON.stringify(
    {
      name: 'lib-a',
      dependencies: {
        'some-dep': '^2.0.0',
      },
    },
    null,
    2,
  );

  setupGitRepo(
    { 'package.json': initialPkgJson },
    { 'package.json': updatedPkgJson },
  );

  await checkMajorBump();

  expect(core.warning).toHaveBeenCalledWith(
    expect.stringContaining(
      'Major bump detected for some-dep@package.json: ^1.5.0 -> ^2.0.0',
    ),
  );
  expect(core.setOutput).toHaveBeenCalledWith('contains_major_bump', 'true');
  expect(core.setFailed).not.toHaveBeenCalled();
});

it('outputs true for a standard major bump in nested package.json (1.x -> 2.x)', async () => {
  const initialPkgJson = JSON.stringify(
    {
      name: 'lib-a',
      dependencies: {
        'some-dep': '^1.5.0',
      },
    },
    null,
    2,
  );

  const updatedPkgJson = JSON.stringify(
    {
      name: 'lib-a',
      dependencies: {
        'some-dep': '^2.0.0',
      },
    },
    null,
    2,
  );

  // Use nested path for the file
  setupGitRepo(
    { 'packages/lib-a/package.json': initialPkgJson },
    { 'packages/lib-a/package.json': updatedPkgJson },
  );

  await checkMajorBump();

  expect(core.warning).toHaveBeenCalledWith(
    expect.stringContaining(
      'Major bump detected for some-dep@packages/lib-a/package.json: ^1.5.0 -> ^2.0.0',
    ),
  );
  expect(core.setOutput).toHaveBeenCalledWith('contains_major_bump', 'true');
  expect(core.setFailed).not.toHaveBeenCalled();
});

it('outputs true for a 0.x major bump (0.1 -> 0.2)', async () => {
  const initialPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      dependencies: {
        'zero-dep': '~0.1.8',
      },
    },
    null,
    2,
  );

  const updatedPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      dependencies: {
        'zero-dep': '~0.2.0',
      },
    },
    null,
    2,
  );

  setupGitRepo(
    { 'package.json': initialPkgJson },
    { 'package.json': updatedPkgJson },
  );

  await checkMajorBump();

  expect(core.warning).toHaveBeenCalledWith(
    expect.stringContaining(
      'Major bump (0.x rule) detected for zero-dep@package.json: ~0.1.8 -> ~0.2.0',
    ),
  );
  expect(core.setOutput).toHaveBeenCalledWith('contains_major_bump', 'true');
  expect(core.setFailed).not.toHaveBeenCalled();
});

it('outputs true for a 0.x major bump (0.1.x -> 0.2.x) even with patch', async () => {
  const initialPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      dependencies: {
        'zero-dep': '^0.1.8',
      },
    },
    null,
    2,
  );

  const updatedPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      dependencies: {
        'zero-dep': '^0.2.1',
      },
    },
    null,
    2,
  );

  setupGitRepo(
    { 'package.json': initialPkgJson },
    { 'package.json': updatedPkgJson },
  );

  await checkMajorBump();

  expect(core.warning).toHaveBeenCalledWith(
    expect.stringContaining(
      'Major bump (0.x rule) detected for zero-dep@package.json: ^0.1.8 -> ^0.2.1',
    ),
  );
  expect(core.setOutput).toHaveBeenCalledWith('contains_major_bump', 'true');
  expect(core.setFailed).not.toHaveBeenCalled();
});

it('outputs false for a 0.x patch bump (0.1.8 -> 0.1.9)', async () => {
  const initialPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      dependencies: {
        'zero-dep': '^0.1.8',
      },
    },
    null,
    2,
  );

  const updatedPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      dependencies: {
        'zero-dep': '^0.1.9',
      },
    },
    null,
    2,
  );

  setupGitRepo(
    { 'package.json': initialPkgJson },
    { 'package.json': updatedPkgJson },
  );

  await checkMajorBump();

  expect(core.warning).not.toHaveBeenCalled();
  expect(core.setOutput).toHaveBeenCalledWith('contains_major_bump', 'false');
  expect(core.setFailed).not.toHaveBeenCalled();
});

it('outputs false when only adding dependencies', async () => {
  const initialPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      dependencies: {},
    },
    null,
    2,
  );

  const updatedPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      dependencies: {
        'new-dep': '^1.0.0',
      },
    },
    null,
    2,
  );

  setupGitRepo(
    { 'package.json': initialPkgJson },
    { 'package.json': updatedPkgJson },
  );

  await checkMajorBump();

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining('Dependency added: new-dep@package.json v^1.0.0'),
  );
  expect(core.setOutput).toHaveBeenCalledWith('contains_major_bump', 'false');
  expect(core.setFailed).not.toHaveBeenCalled();
  expect(core.warning).not.toHaveBeenCalled();
});

it('outputs false when only removing dependencies', async () => {
  const initialPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      dependencies: {
        'old-dep': '^3.2.1',
      },
    },
    null,
    2,
  );

  const updatedPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      dependencies: {},
    },
    null,
    2,
  );

  setupGitRepo(
    { 'package.json': initialPkgJson },
    { 'package.json': updatedPkgJson },
  );

  await checkMajorBump();

  expect(core.info).toHaveBeenCalledWith(
    expect.stringContaining('Dependency removed: old-dep@package.json v^3.2.1'),
  );
  expect(core.setOutput).toHaveBeenCalledWith('contains_major_bump', 'false');
  expect(core.setFailed).not.toHaveBeenCalled();
  expect(core.warning).not.toHaveBeenCalled();
});

it('outputs true and warns if semver parsing fails', async () => {
  const initialPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      dependencies: {
        'bad-dep': 'invalid-version',
      },
    },
    null,
    2,
  );

  const updatedPkgJson = JSON.stringify(
    {
      name: 'test-pkg',
      dependencies: {
        'bad-dep': '^1.0.0',
      },
    },
    null,
    2,
  );

  setupGitRepo(
    { 'package.json': initialPkgJson },
    { 'package.json': updatedPkgJson },
  );

  await checkMajorBump();

  expect(core.warning).toHaveBeenCalledWith(
    expect.stringContaining(
      "Could not parse semver range for bad-dep@package.json: old='invalid-version', new='^1.0.0'. Assuming potential major bump to be safe.",
    ),
  );
  expect(core.setOutput).toHaveBeenCalledWith('contains_major_bump', 'true');
  expect(core.setFailed).not.toHaveBeenCalled();
});

it('handles multiple package.json files and detects major bump in one', async () => {
  const initialRootPkg = JSON.stringify(
    {
      name: 'root',
      dependencies: {
        'dep-a': '^1.0.0',
      },
    },
    null,
    2,
  );

  const updatedRootPkg = JSON.stringify(
    {
      name: 'root',
      dependencies: {
        'dep-a': '^1.1.0',
      },
    },
    null,
    2,
  ); // Minor bump

  const initialAppPkg = JSON.stringify(
    {
      name: 'app',
      dependencies: {
        'dep-b': '^2.2.0',
      },
    },
    null,
    2,
  );

  const updatedAppPkg = JSON.stringify(
    {
      name: 'app',
      dependencies: {
        'dep-b': '^3.0.0',
      },
    },
    null,
    2,
  ); // Major bump

  setupGitRepo(
    {
      'package.json': initialRootPkg,
      'packages/app/package.json': initialAppPkg,
    },
    {
      'package.json': updatedRootPkg,
      'packages/app/package.json': updatedAppPkg,
    },
  );

  await checkMajorBump();

  expect(core.warning).toHaveBeenCalledWith(
    expect.stringContaining(
      'Major bump detected for dep-b@packages/app/package.json: ^2.2.0 -> ^3.0.0',
    ),
  );
  expect(core.setOutput).toHaveBeenCalledWith('contains_major_bump', 'true');
  expect(core.setFailed).not.toHaveBeenCalled();
});

it('fails if GITHUB_BASE_SHA is not set', async () => {
  // Initialize git but don't set the env var
  execSync('git init -b main');
  execSync('git config user.email "test@example.com"');
  execSync('git config user.name "Test User"');
  fs.writeFileSync('dummy.txt', 'content'); // Need some content for a commit
  execSync('git add .');
  execSync('git commit -m "dummy" --no-gpg-sign');
  // Intentionally delete the env var if it was set by setupGitRepo or beforeEach
  delete process.env.GITHUB_BASE_SHA;

  await checkMajorBump();

  expect(core.setFailed).toHaveBeenCalledWith(
    'GITHUB_BASE_SHA environment variable not set.',
  );
  expect(core.setOutput).not.toHaveBeenCalled();
});
