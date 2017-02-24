// @flow

import { mainStory, chalk } from 'storyboard';
import kebabCase from 'kebab-case';
import { readAllSpecs, ROOT_PACKAGE } from './utils/readSpecs';
import removeInternalLinks from './utils/removeInternalLinks';
import writeSpecs from './utils/writeSpecs';
import { exec } from './utils/shell';

const PASS_THROUGH_OPTS = ['production'];

type Options = {
  src: string,
  link: ?string,
  production?: boolean,
};

const run = async (opts: Options) => {
  const { src: srcPatterns, link: linkPattern } = opts;
  const production = opts.production || process.NODE_ENV === 'production';
  const allSpecs = await readAllSpecs(srcPatterns);
  const pkgNames = Object.keys(allSpecs);
  const allRemovedDepsByPackage = {};
  const allRemovedDepsByPackageAndType = {};

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
      const { nextSpecs, allRemovedPackages, removedPackagesByType } =
        removeInternalLinks(prevSpecs, pkgNames, linkPattern);
      allRemovedDepsByPackage[pkgName] = Object.keys(allRemovedPackages);
      allRemovedDepsByPackageAndType[pkgName] = removedPackagesByType;
      if (nextSpecs !== prevSpecs) writeSpecs(specPath, nextSpecs);
      mainStory.info('  - Installing external dependencies...');
      let cmd = 'yarn install';
      PASS_THROUGH_OPTS.forEach((key) => { if (opts[key]) cmd += ` --${kebabCase(key)}`; });
      await exec(cmd, { cwd: pkgPath, logLevel: 'trace' });
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
    const removedPackagesByType = allRemovedDepsByPackageAndType[pkgName];
    const { pkgPath } = allSpecs[pkgName];
    for (let k = 0; k < packagesToLink.length; k++) {
      const depName = packagesToLink[k];
      if (production && isPureDevDependency(removedPackagesByType, depName)) continue;
      mainStory.info(`  - Linking to ${chalk.cyan.bold(depName)}...`);
      await exec(`yarn link ${depName}`, { cwd: pkgPath, logLevel: 'trace' });
    }
  }
};

const isPureDevDependency = (deps, depName) =>
  !((deps.dependencies && deps.dependencies[depName]) ||
  (deps.optionalDependencies && deps.optionalDependencies[depName]) ||
  (deps.peerDependencies && deps.peerDependencies[depName]));

export default run;
