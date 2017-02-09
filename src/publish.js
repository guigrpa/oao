import semver from 'semver';
import inquirer from 'inquirer';
import { exec } from './utils/helpers';
import readAllSpecs, { ROOT_PACKAGE } from './utils/readAllSpecs';
import { mainStory, chalk } from './utils/storyboard';

const run = async () => {
  const allSpecs = await readAllSpecs();
  const pkgNames = Object.keys(allSpecs);

  // Confirm that we have run build
  const { confirmBuild } = await inquirer.prompt([{
    name: 'confirmBuild',
    type: 'confirm',
    message: `Have you run ${chalk.cyan.bold('yarn run build')}?`,
    default: false,
  }]);
  if (!confirmBuild) process.exit(0);

  // Check current branch
  let { stdout: branch } = await exec('git symbolic-ref --short HEAD', { logLevel: 'trace' });
  branch = branch.trim();
  if (branch !== 'master') {
    mainStory.error(`Can't publish from current branch: ${chalk.bold(branch)}`);
    process.exit(1);
  }
  mainStory.info(`Current branch: ${chalk.yellow.bold(branch)}`);

  // Check that the branch is clean
  let { stdout: pending } = await exec('git status --porcelain', { logLevel: 'trace' });
  pending = pending.trim();
  if (pending !== '') {
    mainStory.error(`Can't publish with uncommitted changes (stash/commit them): \n${chalk.bold(pending)}`);
    process.exit(1);
  }
  mainStory.info('No uncommitted changes');

  // Check remote history
  // Ripped off from: https://github.com/sindresorhus/np/blob/master/lib/git.js
  let { stdout: pulls } = await exec('git rev-list --count --left-only @{u}...HEAD', { logLevel: 'trace' });
  pulls = pulls.trim();
  if (pulls !== '0') {
    mainStory.error('Remote history differs. Please pull changes');
    process.exit(1);
  }
  mainStory.info('Remote history matches local history');

  // Determine which packages need publishing
  mainStory.info('Determining which packages need publishing...');
  const dirtyPackages = {};
  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    if (pkgName === ROOT_PACKAGE) continue;
    const { specs } = allSpecs[pkgName];
    if (specs.private) continue;
    const { version } = specs;
    try {
      let { stdout: publishedVersion } = await exec(`npm show ${pkgName} version`, { logLevel: 'info' });
      publishedVersion = publishedVersion.trim();
      if (semver.gt(version, publishedVersion)) {
        dirtyPackages[pkgName] = publishedVersion;
      } else if (semver.lt(version, publishedVersion)) {
        mainStory.error(`New version for ${pkgName} (${chalk.bold(version)}) < published version (${chalk.bold(publishedVersion)})!`);
        process.exit(1);
      }
    } catch (err) {
      dirtyPackages[pkgName] = 'unknown (not published?)';
    }
  }
  const dirtyPkgNames = Object.keys(dirtyPackages);
  dirtyPkgNames.forEach((name) => {
    mainStory.info(`  - ${name}: ${chalk.cyan.bold(dirtyPackages[name])} -> ${chalk.cyan.bold(allSpecs[name].specs.version)}`);
  });

  // Confirm before publishing
  const { confirmPublish } = await inquirer.prompt([{
    name: 'confirmPublish',
    type: 'confirm',
    message: 'Confirm publish?',
    default: false,
  }]);
  if (!confirmPublish) process.exit(0);

  // Publish
  for (let i = 0; i < dirtyPkgNames.length; i++) {
    const pkgName = dirtyPkgNames[i];
    const { pkgPath } = allSpecs[pkgName];
    await exec('npm publish', { cwd: pkgPath });
  }
};

export default run;
