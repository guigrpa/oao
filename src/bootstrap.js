// @flow

import { mainStory, chalk } from 'storyboard';
import kebabCase from 'kebab-case';
import semver from 'semver';
import { readAllSpecs, ROOT_PACKAGE } from './utils/readSpecs';
import removeInternalLinks from './utils/removeInternalLinks';
import writeSpecs from './utils/writeSpecs';
import { exec } from './utils/shell';
import { runInParallel, runInSeries } from './utils/promises';

const PASS_THROUGH_OPTS = [
  'production',
  'noLockfile',
  'pureLockfile',
  'frozenLockfile',
];

type Options = {
  src: string,
  ignoreSrc?: string,
  link: ?string,
  production?: boolean,
  noLockfile?: boolean,
  pureLockfile?: boolean,
  frozenLockfile?: boolean,
  parallel?: boolean,
};

const run = async (opts: Options) => {
  const { src, ignoreSrc, link: linkPattern } = opts;
  const production = opts.production || process.env.NODE_ENV === 'production';
  const allSpecs = await readAllSpecs(src, ignoreSrc);
  const pkgNames = Object.keys(allSpecs);
  const allRemovedDepsByPackage = {};
  const allRemovedDepsByPackageAndType = {};

  // Pass 0: register all subpackages (yarn link) [PARALLEL]
  mainStory.info(`${chalk.bold('PASS 0:')} registering all subpackages...`);
  await runInParallel(pkgNames, async pkgName => {
    if (pkgName === ROOT_PACKAGE) return;
    const { displayName, pkgPath } = allSpecs[pkgName];
    mainStory.info(`  - ${chalk.cyan.bold(displayName)}`);
    await exec('yarn link', {
      cwd: pkgPath,
      logLevel: 'trace',
      errorLogLevel: 'info', // reduce yarn's log level (stderr) when subpackage is already registered
    });
  });

  // Pass 1: install external deps for all subpackages [PARALLEL]
  mainStory.info(
    `${chalk.bold('PASS 1:')} installing external dependencies...`
  );
  const installer = async pkgName => {
    // if (pkgName === ROOT_PACKAGE) return;
    const { displayName, pkgPath, specPath, specs: prevSpecs } = allSpecs[
      pkgName
    ];
    mainStory.info(`  - ${chalk.cyan.bold(displayName)}`);

    // Rewrite package.json without own/linked packages, install, and revert changes
    let fModified = false;
    try {
      const {
        nextSpecs,
        allRemovedPackages,
        removedPackagesByType,
      } = removeInternalLinks(prevSpecs, pkgNames, linkPattern);
      allRemovedDepsByPackage[pkgName] = allRemovedPackages;
      allRemovedDepsByPackageAndType[pkgName] = removedPackagesByType;
      if (nextSpecs !== prevSpecs) {
        writeSpecs(specPath, nextSpecs);
        fModified = true;
      }
      let cmd = 'yarn install';
      PASS_THROUGH_OPTS.forEach(key => {
        if (opts[key]) cmd += ` --${kebabCase(key)}`;
      });
      await exec(cmd, { cwd: pkgPath, logLevel: 'trace' });
    } finally {
      if (prevSpecs != null && fModified) writeSpecs(specPath, prevSpecs);
    }
  };
  if (opts.parallel) {
    await runInParallel(pkgNames, installer, { waitForAllToResolve: true });
  } else {
    await runInSeries(pkgNames, installer);
  }

  // Pass 2: link internal and user-specified deps [PARALLEL]
  mainStory.info(
    `${chalk.bold('PASS 2:')} Installing all internal dependencies...`
  );
  await runInParallel(pkgNames, async pkgName => {
    const allRemovedPackages = allRemovedDepsByPackage[pkgName];
    const removedPackagesByType = allRemovedDepsByPackageAndType[pkgName];
    const packagesToLink = Object.keys(allRemovedPackages);
    const { displayName, pkgPath } = allSpecs[pkgName];
    await runInParallel(packagesToLink, async depName => {
      if (production && isPureDevDependency(removedPackagesByType, depName)) {
        return;
      }
      mainStory.info(
        `  - ${chalk.cyan.bold(displayName)} -> ${chalk.cyan.bold(depName)}`
      );
      const depVersionRange = allRemovedPackages[depName];
      const depSpecs = allSpecs[depName]; // might not exist, if it's a custom link
      const depActualVersion = depSpecs ? depSpecs.specs.version : null;
      if (
        depActualVersion &&
        !semver.satisfies(depActualVersion, depVersionRange)
      ) {
        mainStory.warn(
          `    Warning: ${chalk.cyan.bold(`${depName}@${depActualVersion}`)} ` +
            `does not satisfy specified range: ${chalk.cyan.bold(
              depVersionRange
            )}`
        );
      }
      await exec(`yarn link ${depName}`, { cwd: pkgPath, logLevel: 'trace' });
    });
  });
};

const isPureDevDependency = (deps, depName) =>
  !(
    (deps.dependencies && deps.dependencies[depName]) ||
    (deps.optionalDependencies && deps.optionalDependencies[depName]) ||
    (deps.peerDependencies && deps.peerDependencies[depName])
  );

export default run;
