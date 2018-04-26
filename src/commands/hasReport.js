import fetchReport from '../fetchReport';

export default async function hasReport(sha, { apiKey, apiSecret, endpoint }) {
  try {
    await fetchReport({
      sha,
      apiKey,
      apiSecret,
      endpoint,
    });
    return true;
  } catch (e) {
    return false;
  }
}
