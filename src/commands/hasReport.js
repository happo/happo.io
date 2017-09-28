import fetchReport from '../fetchReport';

export default async function hasReport(sha, { apiKey, apiSecret, viewerEndpoint }) {
  try {
    const existingReport = await fetchReport({
      sha,
      apiKey,
      apiSecret,
      endpoint: viewerEndpoint,
    });
    return true;
  } catch (e) {
    return false;
  }
}
