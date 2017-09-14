import colors from 'colors/safe';

import getReport from './getReport';

export default function constructReport(results) {
  const currentReport = getReport();

  let currentFile;
  results.forEach(({name: targetName, result}) => {
    result.forEach(({ name, file, url }) => {
      if (currentFile !== file) {
        console.log(file);
        currentFile = file;
      }

      if (!currentReport[file]) currentReport[file] = {};
      if (!currentReport[file][name]) currentReport[file][name] = {};

      const oldUrl = currentReport[file][name][targetName];
      if (!oldUrl) {
        currentReport[file][name][targetName] = url;
        console.log(colors.cyan(`  + ${name}@${targetName} | ${url}`));
      } else if (oldUrl !== url) {
        currentReport[file][name][targetName] = url;
        console.log(colors.red(`  • ${name}@${targetName} | ${url}`));
      } else {
        console.log(colors.green(`  ✓ ${name}@${targetName} | ${url}`));
      }
    });
  });

  return currentReport;
}
