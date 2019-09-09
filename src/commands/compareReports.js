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
  { link, message, author, dryRun },
  log = console.log,
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
        },
      },
      { apiKey, apiSecret, maxTries: 2 },
    );
  const firstCompareResult = await makeCompareCall(
    typeof compareThreshold === 'number' || dryRun,
  );
  if (typeof compareThreshold !== 'number') {
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
  await Promise.all(
    firstCompareResult.diffs.map(async ([before, after]) => {
      const diff = await compareSnapshots({ before, after, endpoint });
      if (diff < compareThreshold) {
        log(
          `✓ ${after.component} - ${after.variant} - ${
            after.target
          } diff (${diff}) is within threshold`,
        );
        if (!dryRun) {
          await ignore({ before, after, apiKey, apiSecret, endpoint });
        }
        resolved.push([before, after]);
      } else {
        log(
          `✗ ${after.component} - ${after.variant} - ${
            after.target
          } diff (${diff}) is larger than threshold`,
        );
      }
    }),
  );

  // Make second compare call to finalize the deep compare. The second call will
  // cause a status to be posted to the PR (if applicable). Any ignored diffs
  // from the first call will be excluded from the result.
  const secondCompareResult = await makeCompareCall(false);
  log(secondCompareResult.summary);
  return { resolved, ...secondCompareResult };
}
