export default async function constructReport(results) {
  const report = [];
  results.forEach(({ name: target, result }) => {
    result.forEach(({ component, variant, url, width, height }) => {
      report.push({
        component,
        variant,
        url,
        width,
        height,
        target,
      });
    });
  });

  return report;
}
