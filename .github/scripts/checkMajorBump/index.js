const { execSync } = require('child_process');
const core = require('@actions/core');
const semver = require('semver');

async function main() {
  try {
    const baseSha = process.env.GITHUB_BASE_SHA;

    if (!baseSha) {
      core.setFailed('GITHUB_BASE_SHA environment variable not set.');
      return;
    }

    const headRef = 'HEAD'; // We checked out the head commit

    let containsMajorBump = false;
    // Store changes: { "pkg_name@path/to/package.json": { oldVer: "...", newVer: "..." } }
    const changes = {};

    core.info(`Base SHA: ${baseSha}, Head ref: ${headRef}`);

    // Get the diff for package.json files only
    const diffCommand = `git diff --unified=0 --ignore-all-space --ignore-blank-lines "${baseSha}".."${headRef}" -- "package.json" "**/package.json"`;
    core.info(`Running diff command: ${diffCommand}`);
    const diffOutput = execSync(diffCommand).toString();
    core.info(`Diff output length: ${diffOutput.length}`);
    // core.debug(`Diff output:\n${diffOutput}`); // Can be large

    const lines = diffOutput.split('\n');
    let currentFilePath = null;

    // Regex to capture package name and version string
    const depRegex = /^[+-]\s*"([^"]+)":\s*"([^"]+)"(?:,)?$/;

    for (const line of lines) {
      if (line.startsWith('+++ b/')) {
        currentFilePath = line.substring(6).trim();
        core.info(`Processing file: ${currentFilePath}`);
        continue;
      }
      if (
        !currentFilePath ||
        !line.match(/^[+-]/) ||
        line.startsWith('--- a/') ||
        line.startsWith('diff --git') ||
        line.startsWith('index ')
      ) {
        continue; // Skip non-change lines or lines before first file
      }

      const match = line.match(depRegex);
      if (match) {
        const pkgName = match[1];
        const versionString = match[2];
        const changeKey = `${pkgName}@${currentFilePath}`; // Unique key per package per file

        if (!changes[changeKey]) {
          changes[changeKey] = {
            oldVer: null,
            newVer: null,
            file: currentFilePath,
          };
        }

        if (line.startsWith('-')) {
          changes[changeKey].oldVer = versionString;
        } else if (line.startsWith('+')) {
          changes[changeKey].newVer = versionString;
        }
      }
    } // End loop through diff lines

    // --- Analyze collected changes ---
    core.info('Analyzing collected version changes...');
    for (const key in changes) {
      const change = changes[key];
      // Only analyze if both old and new versions were found (i.e., an update)
      if (change.oldVer && change.newVer) {
        core.info(
          `Analyzing update for ${key}: ${change.oldVer} -> ${change.newVer}`,
        );

        // Use semver.minVersion to handle ranges (^, ~)
        let oldMinVer;
        let newMinVer;
        try {
          oldMinVer = semver.minVersion(change.oldVer)?.version;
          newMinVer = semver.minVersion(change.newVer)?.version;
        } catch {
          core.warning(
            `Could not parse semver range for ${key}: old='${change.oldVer}', new='${change.newVer}'. Assuming potential major bump to be safe.`,
          );
          containsMajorBump = true;
          continue;
        }

        if (oldMinVer && newMinVer) {
          core.info(`Comparing minimum versions: ${oldMinVer} vs ${newMinVer}`);
          // Check for major bump
          if (semver.major(newMinVer) > semver.major(oldMinVer)) {
            core.warning(
              `Major bump detected for ${key}: ${change.oldVer} -> ${change.newVer} (comparing ${oldMinVer} -> ${newMinVer})`,
            );
            containsMajorBump = true;
            break; // Found a major bump
          }
          // Handle 0.x -> 0.y as major
          if (
            semver.major(oldMinVer) === 0 &&
            semver.major(newMinVer) === 0 &&
            semver.minor(newMinVer) > semver.minor(oldMinVer)
          ) {
            core.warning(
              `Major bump (0.x rule) detected for ${key}: ${change.oldVer} -> ${change.newVer} (comparing ${oldMinVer} -> ${newMinVer})`,
            );
            containsMajorBump = true;
            break; // Found a major bump
          }
        } else {
          core.warning(
            `Could not parse semver range for ${key}: old='${change.oldVer}', new='${change.newVer}'. Assuming potential major bump to be safe.`,
          );
          containsMajorBump = true;
          break;
        }
      } else if (change.newVer && !change.oldVer) {
        core.info(
          `Dependency added: ${key} v${change.newVer}. Not considered a major bump.`,
        );
      } else if (change.oldVer && !change.newVer) {
        core.info(
          `Dependency removed: ${key} v${change.oldVer}. Not considered a major bump.`,
        );
      }
    } // End analysis loop

    core.info(`Check complete. Contains major bump: ${containsMajorBump}`);
    // Set output for the workflow step
    core.setOutput('contains_major_bump', containsMajorBump.toString());
  } catch (error) {
    core.error(`Error during script execution: ${error}`);
    core.error(`Stderr: ${error.stderr?.toString()}`);
    // Fail safe: assume major bump if parsing fails
    core.setOutput('contains_major_bump', 'true');
    core.setFailed(
      `Failed to determine version bumps due to error: ${error.message}`,
    );
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
