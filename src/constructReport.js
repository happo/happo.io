export default async function constructReport(results) {
  const report = {};
  results.forEach(({name: targetName, result}) => {
    result.forEach(({ name, file, url }) => {
      if (!report[file]) report[file] = {};
      if (!report[file][name]) report[file][name] = {};

      report[file][name][targetName] = url;
    });
  });

  return report;
}
