const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpfs = {
  _originalCwd: null,
  _tempDir: null,

  mock(files = {}) {
    if (this._tempDir) {
      throw new Error('tmpfs.mock() called before restore()');
    }

    this._originalCwd = process.cwd();
    this._tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'check-major-bump-test-'),
    );
    process.chdir(this._tempDir);

    // Create specified files
    Object.entries(files).forEach(([filePath, content]) => {
      const dir = path.dirname(filePath);
      if (dir !== '.') {
        // Ensure the directory exists within the temp dir
        fs.mkdirSync(path.join(this._tempDir, dir), { recursive: true });
      }

      fs.writeFileSync(path.join(this._tempDir, filePath), content);
    });
  },

  restore() {
    if (!this._originalCwd || !this._tempDir) {
      // Avoid errors if restore is called without mock or multiple times
      return;
    }

    try {
      process.chdir(this._originalCwd);
      fs.rmSync(this._tempDir, { recursive: true, force: true });
    } catch (err) {
      // Log potential cleanup errors but don't fail the test run
      console.error(`Error cleaning up temp directory ${this._tempDir}:`, err);
    } finally {
      this._originalCwd = null;
      this._tempDir = null;
    }
  },

  // Helper to get the current temp dir path if needed
  getTempDir() {
    return this._tempDir;
  },
};

module.exports = tmpfs;
