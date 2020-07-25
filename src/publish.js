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
import { addVersionLine } from './utils/changelog';
import { masterOrMainBranch } from './utils/helpers';
import { calcGraphAndReturnAsAllSpecs } from './utils/calcGraph';

const DEBUG_SKIP_CHECKS = false;
const RELEASE_INCREMENTS = ['major', 'minor', 'patch'];
const PRERELEASE_INCREMENTS = ['rc', 'beta', 'alpha'];
const INCREMENTS = [...RELEASE_INCREMENTS, ...PRERELEASE_INCREMENTS];

type Options = {
  src: string,
  ignoreSrc?: string,
  incrementVersionBy?: string,
  master: boolean,
  checkUncommitted: boolean,
  checkUnpulled: boolean,
  checks: boolean,
  confirm: boolean,
  bump: boolean,
  gitCommit: boolean,
  newVersion?: string,
  npmPublish: boolean,
  publishTag?: string,
  otp?: string,
  access?: string,
  changelog: boolean,
  changelogPath: string,
  single: boolean,
  // For unit tests
  _date?: ?Object, // overrides the current date
  _masterVersion?: string, // overrides the current master version
};

const run = async ({
  src,
  ignoreSrc,
  master,
  checkUncommitted,
  checkUnpulled,
  checks,
  confirm,
  bump,
  gitCommit,
  newVersion,
  npmPublish,
  publishTag,
  incrementVersionBy,
  changelog,
  changelogPath,
  single,
  otp,
  access,
  _date,
  _masterVersion,
}: Options) => {
  const allSpecs = calcGraphAndReturnAsAllSpecs(
    await readAllSpecs(src, ignoreSrc)
  );

  // Confirm that we have run build and run prepublish checks
  if (confirm && !(await confirmBuild())) return;
  await prepublishChecks({ checks, master, checkUncommitted, checkUnpulled });

  // Get list of packages to be updated. This is NOT the list of packages to
  // be published, since some of them might be private. But all of them will
  // be version-bumped
  const pkgList = [];
  let numPublic = 0;
  Object.keys(allSpecs).forEach(pkgName => {
    if (pkgName === ROOT_PACKAGE && !single) return;
    pkgList.push(pkgName);
    const { specs } = allSpecs[pkgName];
    if (!specs.private) numPublic += 1;
  });
  if (!pkgList.length) {
    mainStory.info('No packages found!');
    return;
  }

  if (bump) {
    // Determine a suitable new version number
    const lastTag = await gitLastTag();
    const masterVersion =
      _masterVersion || (await getMasterVersion(allSpecs, lastTag));
    if (masterVersion == null) return;
    if (incrementVersionBy) validateVersionIncrement(incrementVersionBy);
    const nextVersion =
      newVersion ||
      calcNextVersion(masterVersion, incrementVersionBy) ||
      (await promptNextVersion(masterVersion));

    // Confirm before proceeding
    if (confirm && !(await confirmPublish({ pkgList, numPublic, nextVersion })))
      return;

    // Update package.json's for pkgList packages AND THE ROOT PACKAGE
    const pkgListPlusRoot = single ? pkgList : pkgList.concat(ROOT_PACKAGE);
    pkgListPlusRoot.forEach(pkgName => {
      const { specPath, specs } = allSpecs[pkgName];
      specs.version = nextVersion;
      writeSpecs(specPath, specs);
    });

    // Update changelog
    if (changelog) {
      addVersionLine({ changelogPath, version: nextVersion, _date });
    }

    // Commit, tag and push
    if (gitCommit) {
      await gitCommitChanges(`v${nextVersion}`);
      await gitAddTag(`v${nextVersion}`);
      await gitPushWithTags();
    }
  }

  // Publish
  if (npmPublish) {
    for (let i = 0; i < pkgList.length; i++) {
      const pkgName = pkgList[i];
      const { pkgPath, specs } = allSpecs[pkgName];
      if (specs.private) continue; // we don't want npm to complain :)
      let cmd = 'npm publish';
      if (publishTag != null) cmd += ` --tag ${publishTag}`;
      if (otp != null) cmd += ` --otp ${otp}`;
      if (access === 'public' || access === 'restricted')
        cmd += ` --access ${access}`;
      await exec(cmd, { cwd: pkgPath });
    }
  }
};

// ------------------------------------------------
// Helpers
// ------------------------------------------------
const prepublishChecks = async ({
  checks,
  master,
  checkUncommitted,
  checkUnpulled,
}) => {
  if (!checks) return;
  if (DEBUG_SKIP_CHECKS) {
    mainStory.warn('DEBUG_SKIP_CHECKS should be disabled!!');
  }

  // Check current branch
  const branch = await gitCurBranch();
  if (!masterOrMainBranch(branch)) {
    if (master) {
      mainStory.error(
        `Can't publish from current branch: ${chalk.bold(branch)}`
      );
      if (!DEBUG_SKIP_CHECKS) throw new Error('BRANCH_CHECK_FAILED');
    }
    mainStory.warn(
      `Publishing from a non-master or non-main branch: ${chalk.red.bold(
        branch
      )}`
    );
  } else {
    mainStory.info(`Current branch: ${chalk.yellow.bold(branch)}`);
  }

  // Check that the branch is clean
  const uncommitted = await gitUncommittedChanges();
  if (uncommitted !== '') {
    if (checkUncommitted) {
      mainStory.error(
        `Can't publish with uncommitted changes (stash/commit them): \n${chalk.bold(
          uncommitted
        )}`
      );
      if (!DEBUG_SKIP_CHECKS) throw new Error('UNCOMMITTED_CHECK_FAILED');
    }
    mainStory.warn('Publishing with uncommitted changes');
  } else {
    mainStory.info('No uncommitted changes');
  }

  // Check remote history
  const unpulled = await gitUnpulledChanges();
  if (unpulled !== '0') {
    if (checkUnpulled) {
      mainStory.error('Remote history differs. Please pull changes');
      if (!DEBUG_SKIP_CHECKS) throw new Error('UNPULLED_CHECK_FAILED');
    }
    mainStory.warn('Publishing with unpulled changes');
  } else {
    mainStory.info('Remote history matches local history');
  }
};

const confirmBuild = async () => {
  const { confirmBuild: out } = await inquirer.prompt([
    {
      name: 'confirmBuild',
      type: 'confirm',
      message: 'Have you built all your packages for production?',
      default: false,
    },
  ]);
  return out;
};

const confirmPublish = async ({ pkgList, numPublic, nextVersion }) => {
  const { confirmPublish: out } = await inquirer.prompt([
    {
      name: 'confirmPublish',
      type: 'confirm',
      message: `Confirm release (${chalk.yellow.bold(
        pkgList.length
      )} package/s, ${chalk.yellow.bold(numPublic)} public, v${chalk.cyan.bold(
        nextVersion
      )})?`,
      default: false,
    },
  ]);
  return out;
};

const validateVersionIncrement = incrementVersionBy => {
  if (INCREMENTS.indexOf(incrementVersionBy) < 0) {
    mainStory.error(
      `Value specified for --increment-version-by: ${chalk.bold(
        incrementVersionBy
      )} is invalid.`
    );
    mainStory.error(
      `It should be one of (${INCREMENTS.join(', ')}), or not specified.`
    );
    if (!DEBUG_SKIP_CHECKS) throw new Error('INVALID_INCREMENT_BY_VALUE');
  }
};

const getMasterVersion = async (allSpecs, lastTag) => {
  let masterVersion = allSpecs[ROOT_PACKAGE].specs.version;
  if (lastTag != null) {
    const tagVersion = semver.clean(lastTag);
    mainStory.info(`Last tag found: ${chalk.yellow.bold(lastTag)}`);
    if (tagVersion !== masterVersion) {
      mainStory.warn(
        `Last tagged version ${chalk.cyan.bold(
          tagVersion
        )} does not match package.json version ${chalk.cyan.bold(
          masterVersion
        )}`
      );
      const { confirm } = await inquirer.prompt([
        {
          name: 'confirm',
          type: 'confirm',
          message: 'Continue?',
          default: false,
        },
      ]);
      if (!confirm) return null;
      if (semver.valid(tagVersion) && semver.gt(tagVersion, masterVersion)) {
        masterVersion = tagVersion;
      }
      mainStory.warn(
        `Using ${chalk.cyan.bold(
          masterVersion
        )} as reference (the highest one of both)`
      );
    }
  } else {
    mainStory.warn('Repo has no tags yet');
  }
  if (!semver.valid(masterVersion)) {
    mainStory.error(
      `Master version ${chalk.cyan.bold(
        masterVersion
      )} is invalid. Please correct it manually`
    );
    throw new Error('INVALID_VERSION');
  }
  return masterVersion;
};

const calcNextVersion = (prevVersion: string, incrementBy = ''): ?string => {
  if (!incrementBy) return null;
  const isPreRelease = PRERELEASE_INCREMENTS.indexOf(incrementBy) >= 0;
  const increment = isPreRelease ? 'prerelease' : incrementBy;
  const isNewPreRelease = isPreRelease && prevVersion.indexOf(incrementBy) < 0;
  return isNewPreRelease
    ? `${semver.inc(prevVersion, 'major')}-${incrementBy}.0`
    : semver.inc(prevVersion, increment);
};

const promptNextVersion = async (prevVersion: string): Promise<string> => {
  const major = semver.inc(prevVersion, 'major');
  const minor = semver.inc(prevVersion, 'minor');
  const patch = semver.inc(prevVersion, 'patch');
  const prerelease = semver.inc(prevVersion, 'prerelease');
  const rc = prevVersion.indexOf('rc') < 0 ? `${major}-rc.0` : prerelease;
  const beta = prevVersion.indexOf('beta') < 0 ? `${major}-beta.0` : prerelease;
  const alpha =
    prevVersion.indexOf('alpha') < 0 ? `${major}-alpha.0` : prerelease;
  const { nextVersion } = await inquirer.prompt([
    {
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
    },
  ]);
  return nextVersion;
};

// ------------------------------------------------
// Public
// ------------------------------------------------
export default run;
