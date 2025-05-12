export default async function constructReport(results) {
  const report = [];
  results.forEach(({ name: target, result }) => {
    result.forEach(
      ({ component, variant, url, width, height, axeResults, snapRequestId }) => {
        report.push({
          component,
          variant,
          url,
          width,
          height,
          target,
          snapRequestId,
          axeResults,
        });
      },
    );
  });

  return report;
}
