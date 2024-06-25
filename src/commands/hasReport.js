import fetchReport from '../fetchReport';

export default async function hasReport(
  sha,
  { apiKey, apiSecret, endpoint, project },
) {
  try {
    await fetchReport({
      sha,
      apiKey,
      apiSecret,
      endpoint,
      project,
    });
    return true;
  } catch (e) {
    return false;
  }
}
