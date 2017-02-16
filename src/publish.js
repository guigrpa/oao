// @flow

import semver from 'semver';
import inquirer from 'inquirer';
import { mainStory, chalk } from 'storyboard';
import { readAllSpecs, ROOT_PACKAGE } from './utils/readSpecs';
import writeSpecs from './utils/writeSpecs';
import { exec } from './utils/shell';
import {
  gitLastTag,
  gitCurBranch,
  gitUncommittedChanges,
  gitUnpulledChanges,
  gitDiffSinceIn,
  gitCommitChanges,
  gitAddTag,
  gitPushWithTags,
} from './utils/git';

const DEBUG_SKIP_CHECKS = false;

type Options = {|
  src: string,
  master: boolean,
  confirm: boolean,
  publishTag?: string,
  _autoVersion?: boolean,
|};

const run = async ({
  src: srcPatterns,
  master,
  confirm,
  publishTag,
  // For unit tests
  _autoVersion = false,
}: Options) => {
  const allSpecs = await readAllSpecs(srcPatterns);

  // Confirm that we have run build
  if (confirm) {
    const { confirmBuild } = await inquirer.prompt([{
      name: 'confirmBuild',
      type: 'confirm',
      message: 'Have you built all your packages for production?',
      default: false,
    }]);
    if (!confirmBuild) return;
  }
  // Prepublish checks
  await prepublishChecks({ master });

  // Get last tag and find packages requiring updates
  const lastTag = await gitLastTag();
  const dirty = await findPackagesToUpdate(allSpecs, lastTag);
  if (!dirty.length) {
    mainStory.info('No packages need to be published');
    return;
  }

  // Determine a suitable version number
  const masterVersion = await getMasterVersion(allSpecs, lastTag);
  if (masterVersion == null) return;
  const nextVersion = await getNextVersion(masterVersion, _autoVersion);

  // Confirm before publishing
  if (confirm) {
    const { confirmPublish } = await inquirer.prompt([{
      name: 'confirmPublish',
      type: 'confirm',
      message: `Confirm publish (${chalk.yellow.bold(dirty.length)} package/s, ` +
        `v${chalk.cyan.bold(nextVersion)})?`,
      default: false,
    }]);
    if (!confirmPublish) return;
  }

  // Update package.json's for dirty packages AND THE ROOT PACKAGE
  const dirtyPlusRoot = dirty.concat(ROOT_PACKAGE);
  for (let i = 0; i < dirtyPlusRoot.length; i++) {
    const pkgName = dirtyPlusRoot[i];
    const { specPath, specs } = allSpecs[pkgName];
    specs.version = nextVersion;
    writeSpecs(specPath, specs);
  }

  // Commit, tag and push
  await gitCommitChanges(`v${nextVersion}`);
  await gitAddTag(`v${nextVersion}`);
  await gitPushWithTags();

  // Publish
  for (let i = 0; i < dirty.length; i++) {
    const pkgName = dirty[i];
    const { pkgPath } = allSpecs[pkgName];
    let cmd = 'npm publish';
    if (publishTag != null) cmd += ` --tag ${publishTag}`;
    await exec(cmd, { cwd: pkgPath });
  }
};

// ------------------------------------------------
// Helpers
// ------------------------------------------------
const prepublishChecks = async ({ master }) => {
  if (DEBUG_SKIP_CHECKS) mainStory.warn('DEBUG_SKIP_CHECKS should be disabled!!');

  // Check current branch
  const branch = await gitCurBranch();
  if (branch !== 'master') {
    if (master) {
      mainStory.error(`Can't publish from current branch: ${chalk.bold(branch)}`);
      if (!DEBUG_SKIP_CHECKS) throw new Error('BRANCH_CHECK_FAILED');
    }
    mainStory.warn(`Publishing from a non-master branch: ${chalk.red.bold(branch)}`);
  } else {
    mainStory.info(`Current branch: ${chalk.yellow.bold(branch)}`);
  }

  // Check that the branch is clean
  const uncommitted = await gitUncommittedChanges();
  if (uncommitted !== '') {
    mainStory.error(`Can't publish with uncommitted changes (stash/commit them): \n${chalk.bold(uncommitted)}`);
    if (!DEBUG_SKIP_CHECKS) throw new Error('UNCOMMITTED_CHECK_FAILED');
  }
  mainStory.info('No uncommitted changes');

  // Check remote history
  const unpulled = await gitUnpulledChanges();
  if (unpulled !== '0') {
    mainStory.error('Remote history differs. Please pull changes');
    if (!DEBUG_SKIP_CHECKS) throw new Error('UNPULLED_CHECK_FAILED');
  }
  mainStory.info('Remote history matches local history');
};

const findPackagesToUpdate = async (allSpecs, lastTag) => {
  const pkgNames = Object.keys(allSpecs);
  const dirty = [];
  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    if (pkgName === ROOT_PACKAGE) continue;
    const { pkgPath, specs } = allSpecs[pkgName];
    if (specs.private) continue;
    const diff = await gitDiffSinceIn(lastTag, pkgPath);
    if (diff !== '') {
      const numChanges = diff.split('\n').length;
      mainStory.info(`- Package ${pkgName} (currently ${chalk.cyan.bold(specs.version)}) has changed (#files: ${numChanges})`);
      dirty.push(pkgName);
    }
  }
  return dirty;
};

const getMasterVersion = async (allSpecs, lastTag) => {
  let masterVersion = allSpecs[ROOT_PACKAGE].specs.version;
  if (lastTag != null) {
    const tagVersion = semver.clean(lastTag);
    mainStory.info(`Last tag found: ${chalk.yellow.bold(lastTag)}`);
    if (tagVersion !== masterVersion) {
      mainStory.warn(`Last tagged version ${chalk.cyan.bold(tagVersion)} does not match package.json version ${chalk.cyan.bold(masterVersion)}`);
      mainStory.warn('This may cause inaccuracies when determining which packages ' +
        'need to be released, since oao uses tags to detect package changes');
      const { confirm } = await inquirer.prompt([{
        name: 'confirm',
        type: 'confirm',
        message: 'Continue?',
        default: false,
      }]);
      if (!confirm) return null;
      if (semver.valid(tagVersion) && semver.gt(tagVersion, masterVersion)) {
        masterVersion = tagVersion;
      }
      mainStory.warn(`Using ${chalk.cyan.bold(masterVersion)} as reference (the highest one of both)`);
    }
  } else {
    mainStory.warn('Repo has no tags yet');
  }
  if (!semver.valid(masterVersion)) {
    mainStory.error(`Master version ${chalk.cyan.bold(masterVersion)} is invalid. Please correct it manually`);
    throw new Error('INVALID_VERSION');
  }
  return masterVersion;
};

const getNextVersion = async (prevVersion: string, _autoVersion: ?boolean): Promise<string> => {
  const major = semver.inc(prevVersion, 'major');
  if (_autoVersion) return major;
  const minor = semver.inc(prevVersion, 'minor');
  const patch = semver.inc(prevVersion, 'patch');
  const prerelease = semver.inc(prevVersion, 'prerelease');
  const rc = prevVersion.indexOf('rc') < 0 ? `${major}-rc.0` : prerelease;
  const beta = prevVersion.indexOf('beta') < 0 ? `${major}-beta.0` : prerelease;
  const alpha = prevVersion.indexOf('alpha') < 0 ? `${major}-alpha.0` : prerelease;
  const { nextVersion } = await inquirer.prompt([{
    name: 'nextVersion',
    type: 'list',
    message: `Current version is ${chalk.cyan.bold(prevVersion)}. Next one?`,
    choices: [
      { name: `Major (${chalk.cyan.bold(major)})`, value: major },
      { name: `Minor (${chalk.cyan.bold(minor)})`, value: minor },
      { name: `Patch (${chalk.cyan.bold(patch)})`, value: patch },
      { name: `Release candidate (${chalk.cyan.bold(rc)})`, value: rc },
      { name: `Beta (${chalk.cyan.bold(beta)})`, value: beta },
      { name: `Alpha (${chalk.cyan.bold(alpha)})`, value: alpha },
    ],
    defaultValue: 2,
  }]);
  return nextVersion;
};

// ------------------------------------------------
// Public
// ------------------------------------------------
export default run;
