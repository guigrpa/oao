// @flow

import { set as timmSet } from 'timm';
import { mainStory, chalk } from 'storyboard';
import inquirer from 'inquirer';
import semver from 'semver';
import { readAllSpecs } from './utils/readSpecs';
import writeSpecs from './utils/writeSpecs';

type Options = {
  src: string,
  confirm?: boolean,
};

const run = async (version: string, { src: srcPatterns, confirm = true }: Options) => {
  if (!semver.valid(version)) {
    mainStory.error(`Version ${version} is not valid`);
    throw new Error('INVALID_VERSION');
  }

  const allSpecs = await readAllSpecs(srcPatterns);
  const pkgNames = Object.keys(allSpecs);

  // Ask for confirmation
  if (confirm) {
    const { goAhead } = await inquirer.prompt([{
      name: 'goAhead',
      type: 'confirm',
      message: 'Are you sure you want to reset the version number of all packages, ' +
        `including the monorepo root, to ${chalk.cyan.yellow(version)} ` +
        `(${chalk.cyan.bold(pkgNames.length)} package/s, including monorepo)?`,
      default: false,
    }]);
    if (!goAhead) process.exit(0);
  }

  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    const { specPath, specs: prevSpecs } = allSpecs[pkgName];
    const nextSpecs = timmSet(prevSpecs, 'version', version);
    writeSpecs(specPath, nextSpecs);
  }
};

export default run;
