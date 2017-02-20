// @flow

import { mainStory, chalk } from 'storyboard';
import { readAllSpecs, ROOT_PACKAGE } from './utils/readSpecs';
import removeInternalLinks from './utils/removeInternalLinks';
import writeSpecs from './utils/writeSpecs';
import { exec } from './utils/shell';

type Options = {
  src: string,
  link: ?string,
};

const run = async (opts: Options) => {
  const { src: srcPatterns, link: linkPattern } = opts;
  const allSpecs = await readAllSpecs(srcPatterns);
  const pkgNames = Object.keys(allSpecs);
  const allRemovedDepsByPackage = {};

  // Pass 1: register each package with yarn, and install external deps
  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    if (pkgName === ROOT_PACKAGE) continue;
    const { pkgPath, specPath, specs: prevSpecs } = allSpecs[pkgName];
    mainStory.info(`${chalk.bold('PASS 1:')} processing ${chalk.cyan.bold(pkgName)}...`);

    // Link
    mainStory.info('  - Registering...');
    await exec('yarn link', {
      cwd: pkgPath,
      logLevel: 'trace',
      errorLogLevel: 'info',
    });

    // Rewrite package.json without own/linked packages, install, and revert changes
    try {
      const { nextSpecs, allRemovedPackages } =
        removeInternalLinks(prevSpecs, pkgNames, linkPattern);
      allRemovedDepsByPackage[pkgName] = Object.keys(allRemovedPackages);
      if (nextSpecs !== prevSpecs) writeSpecs(specPath, nextSpecs);
      mainStory.info('  - Installing external dependencies...');
      await exec('yarn install', { cwd: pkgPath, logLevel: 'trace' });
    } finally {
      if (prevSpecs != null) writeSpecs(specPath, prevSpecs);
    }
  }

  // Pass 2: link internal and user-specified deps
  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    if (pkgName === ROOT_PACKAGE) continue;
    mainStory.info(
      `${chalk.bold('PASS 2:')} installing internal deps for ${chalk.cyan.bold(pkgName)}...`);
    const packagesToLink = allRemovedDepsByPackage[pkgName];
    const { pkgPath } = allSpecs[pkgName];
    for (let k = 0; k < packagesToLink.length; k++) {
      const depName = packagesToLink[k];
      mainStory.info(`  - Linking to ${chalk.cyan.bold(depName)}...`);
      await exec(`yarn link ${depName}`, { cwd: pkgPath, logLevel: 'trace' });
    }
  }
};

export default run;
