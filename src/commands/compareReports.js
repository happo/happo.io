import compareSnapshots from '../compareSnapshots';
import makeRequest from '../makeRequest';

function ignore({ before, after, apiKey, apiSecret, endpoint }) {
  return makeRequest(
    {
      url: `${endpoint}/api/ignored-diffs`,
      method: 'POST',
      json: true,
      body: {
        snapshot1Id: before.id,
        snapshot2Id: after.id,
      },
    },
    { apiKey, apiSecret },
  );
}

export default async function compareReports(
  sha1,
  sha2,
  { apiKey, apiSecret, endpoint, project, compareThreshold },
  { link, message, author, dryRun, isAsync },
  log = console.log,
  maxTries = 5,
) {
  const makeCompareCall = (skipStatusPost) =>
    makeRequest(
      {
        url: `${endpoint}/api/reports/${sha1}/compare/${sha2}`,
        method: 'POST',
        json: true,
        body: {
          link,
          message,
          author,
          project,
          skipStatusPost,
          isAsync,
        },
      },
      { apiKey, apiSecret, maxTries },
    );
  const firstCompareResult = await makeCompareCall(
    typeof compareThreshold === 'number' || dryRun,
  );
  if (typeof compareThreshold !== 'number' || isAsync) {
    // We're not using a threshold -- return results right away
    return firstCompareResult;
  }

  const resolved = [];
  log(
    `Found ${
      firstCompareResult.diffs.length
    } diffs to deep-compare using threshold ${compareThreshold}`,
  );
  if (dryRun) {
    log('Running in --dry-run mode -- no destructive commands will be issued');
  }

  const diffsClone = firstCompareResult.diffs.slice(0);
  let batch;
  // eslint-disable-next-line no-cond-assign
  while ((batch = diffsClone.splice(0, 10)).length > 0) {
    // Batch logs to help avoid running out of file descriptors
    const linesToLog = [];

    // eslint-disable-next-line no-await-in-loop
    await Promise.all(
      batch.map(async ([before, after]) => {
        const firstDiffDistance = await compareSnapshots({
          before,
          after,
          endpoint,
          compareThreshold,
          retries: maxTries,
        });
        if (!firstDiffDistance) {
          linesToLog.push(
            `✓ ${after.component} - ${after.variant} - ${
              after.target
            } - diff below threshold, auto-ignoring`,
          );

          if (!dryRun) {
            await ignore({ before, after, apiKey, apiSecret, endpoint });
          }

          resolved.push([before, after]);
        }
      }),
    );

    if (linesToLog.length) {
      log(linesToLog.join('\n'));
    }
  }

  const totalDiffsCount = firstCompareResult.diffs.length;
  const autoIgnoredDiffsCount = resolved.length;

  log(
    `${autoIgnoredDiffsCount} out of ${totalDiffsCount} were below threshold and auto-ignored`,
  );

  // Make second compare call to finalize the deep compare. The second call will
  // cause a status to be posted to the PR (if applicable). Any ignored diffs
  // from the first call will be excluded from the result.
  const secondCompareResult = await makeCompareCall(false);
  log(secondCompareResult.summary);
  return { resolved, ...secondCompareResult };
}
