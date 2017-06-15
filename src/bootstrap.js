// @flow

import { mainStory, chalk } from 'storyboard';
import kebabCase from 'kebab-case';
import semver from 'semver';
import { readAllSpecs, ROOT_PACKAGE } from './utils/readSpecs';
import removeInternalLinks from './utils/removeInternalLinks';
import writeSpecs from './utils/writeSpecs';
import { exec } from './utils/shell';

const PASS_THROUGH_OPTS = ['production', 'noLockfile', 'pureLockfile', 'frozenLockfile'];

type Options = {
  src: string,
  ignoreSrc?: string,
  link: ?string,
  production?: boolean,
};

const run = async (opts: Options) => {
  const { src, ignoreSrc, link: linkPattern } = opts;
  const production = opts.production || process.env.NODE_ENV === 'production';
  const allSpecs = await readAllSpecs(src, ignoreSrc);
  const pkgNames = Object.keys(allSpecs);
  const allRemovedDepsByPackage = {};
  const allRemovedDepsByPackageAndType = {};

  // Pass 1: register each package with yarn, and install external deps
  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    // if (pkgName === ROOT_PACKAGE) continue;
    const { displayName, pkgPath, specPath, specs: prevSpecs } = allSpecs[pkgName];
    mainStory.info(`${chalk.bold('PASS 1:')} processing ${chalk.cyan.bold(displayName)}...`);

    // Link
    if (pkgName !== ROOT_PACKAGE) {
      mainStory.info('  - Registering...');
      await exec('yarn link', { cwd: pkgPath, logLevel: 'trace', errorLogLevel: 'info' });
    }

    // Rewrite package.json without own/linked packages, install, and revert changes
    let fModified = false;
    try {
      const { nextSpecs, allRemovedPackages, removedPackagesByType } =
        removeInternalLinks(prevSpecs, pkgNames, linkPattern);
      allRemovedDepsByPackage[pkgName] = allRemovedPackages;
      allRemovedDepsByPackageAndType[pkgName] = removedPackagesByType;
      if (nextSpecs !== prevSpecs) {
        writeSpecs(specPath, nextSpecs);
        fModified = true;
      }
      mainStory.info('  - Installing external dependencies...');
      let cmd = 'yarn install';
      PASS_THROUGH_OPTS.forEach((key) => { if (opts[key]) cmd += ` --${kebabCase(key)}`; });
      await exec(cmd, { cwd: pkgPath, logLevel: 'trace' });
    } finally {
      if (prevSpecs != null && fModified) writeSpecs(specPath, prevSpecs);
    }
  }

  // Pass 2: link internal and user-specified deps
  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    const allRemovedPackages = allRemovedDepsByPackage[pkgName];
    const removedPackagesByType = allRemovedDepsByPackageAndType[pkgName];
    const packagesToLink = Object.keys(allRemovedPackages);
    const { displayName, pkgPath } = allSpecs[pkgName];
    mainStory.info(`${chalk.bold('PASS 2:')} installing internal deps for ` +
      `${chalk.cyan.bold(displayName)}...`);
    for (let k = 0; k < packagesToLink.length; k++) {
      const depName = packagesToLink[k];
      if (production && isPureDevDependency(removedPackagesByType, depName)) continue;
      mainStory.info(`  - Linking to ${chalk.cyan.bold(depName)}...`);
      const depVersionRange = allRemovedPackages[depName];
      const depSpecs = allSpecs[depName]; // might not exist, if it's a custom link
      const depActualVersion = depSpecs ? depSpecs.specs.version : null;
      if (depActualVersion && !semver.satisfies(depActualVersion, depVersionRange)) {
        mainStory.warn(`  - Warning: ${chalk.cyan.bold(`${depName}@${depActualVersion}`)} ` +
          `does not satisfy specified range: ${chalk.cyan.bold(depVersionRange)}`);
      }
      await exec(`yarn link ${depName}`, { cwd: pkgPath, logLevel: 'trace' });
    }
  }
};

const isPureDevDependency = (deps, depName) =>
  !((deps.dependencies && deps.dependencies[depName]) ||
  (deps.optionalDependencies && deps.optionalDependencies[depName]) ||
  (deps.peerDependencies && deps.peerDependencies[depName]));

export default run;
