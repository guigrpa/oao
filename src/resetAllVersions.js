import { set as timmSet } from 'timm';
import { mainStory, chalk } from 'storyboard';
import inquirer from 'inquirer';
import semver from 'semver';
import { readAllSpecs } from './utils/readSpecs';
import writeSpecs from './utils/writeSpecs';

const run = async (version, { src: srcPatterns }) => {
  if (!semver.valid(version)) {
    mainStory.error(`Version ${version} is not valid`);
    process.exit(1);
  }

  const allSpecs = await readAllSpecs(srcPatterns);
  const pkgNames = Object.keys(allSpecs);

  // Confirm that we have run build
  const { confirm } = await inquirer.prompt([{
    name: 'confirm',
    type: 'confirm',
    message: 'Are you sure you want to reset the version number of all packages, ' +
      `including the monorepo root, to ${chalk.cyan.yellow(version)} ` +
      `(${chalk.cyan.bold(pkgNames.length)} package/s, including monorepo)?`,
    default: false,
  }]);
  if (!confirm) process.exit(0);

  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    const { specPath, specs: prevSpecs } = allSpecs[pkgName];
    const nextSpecs = timmSet(prevSpecs, 'version', version);
    writeSpecs(specPath, nextSpecs);
  }
};

export default run;
