// @flow

import { mainStory, chalk } from 'storyboard';
import { readAllSpecs, ROOT_PACKAGE } from './utils/readSpecs';
import removeInternalLinks from './utils/removeInternalLinks';
import writeSpecs from './utils/writeSpecs';
import { exec } from './utils/shell';

const DEP_TYPES = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

type Options = {| src: string |};

const run = async ({ src: srcPatterns }: Options) => {
  const allSpecs = await readAllSpecs(srcPatterns);
  const pkgNames = Object.keys(allSpecs);

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

    // Rewrite package.json without own packages, install, and revert changes
    try {
      const { nextSpecs } = removeInternalLinks(prevSpecs, pkgNames);
      if (nextSpecs !== prevSpecs) writeSpecs(specPath, nextSpecs);
      mainStory.info('  - Installing external dependencies...');
      await exec('yarn install', { cwd: pkgPath, logLevel: 'trace' });
    } finally {
      if (prevSpecs != null) writeSpecs(specPath, prevSpecs);
    }
  }

  // Pass 2: link internal deps
  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    if (pkgName === ROOT_PACKAGE) continue;
    const { pkgPath, specs } = allSpecs[pkgName];
    mainStory.info(
      `${chalk.bold('PASS 2:')} installing internal deps for ${chalk.cyan.bold(pkgName)}...`);
    for (let k = 0; k < pkgNames.length; k++) {
      const depName = pkgNames[k];
      if (depName === pkgName) continue;
      for (let m = 0; m < DEP_TYPES.length; m++) {
        const deps = specs[DEP_TYPES[m]];
        if (deps == null) continue;
        if (deps[depName]) {
          mainStory.info(`  - Linking to ${chalk.cyan.bold(depName)}...`);
          await exec(`yarn link ${depName}`, { cwd: pkgPath, logLevel: 'trace' });
          break;
        }
      }
    }
  }
};

export default run;
