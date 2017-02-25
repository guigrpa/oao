// @flow

/* eslint-disable no-console */

import { chalk, config as storyboardConfig } from 'storyboard';
import { readAllSpecs, ROOT_PACKAGE } from './utils/readSpecs';
import {
  gitLastTag,
  gitCurBranch,
  gitUncommittedChanges,
  gitUnpulledChanges,
  gitDiffSinceIn,
} from './utils/git';

type Options = { src: string };

const run = async (opts: Options) => {
  storyboardConfig({ filter: '-*' });
  const lastTag = await gitStatus();
  await subpackageStatus(opts, lastTag);
  console.log('');
};

const gitStatus = async () => {
  console.log('');
  console.log('* Git status:');
  console.log('');
  try {
    const branch = await gitCurBranch();
    console.log(`    - Current branch: ${chalk.cyan.bold(branch)}`);
  } catch (err) {
    console.log(`    - ${chalk.red.bold('Could not be determined')} (is this a git repo?)`);
  }
  let lastTag;
  try {
    lastTag = await gitLastTag();
    console.log(`    - Last tag: ${lastTag != null ? chalk.cyan.bold(lastTag) : chalk.yellow.bold('NONE YET')}`);
  } catch (err) { /* ignore */ }
  try {
    const uncommitted = await gitUncommittedChanges();
    console.log(`    - Uncommitted changes: ${uncommitted !== '' ? chalk.yellow.bold('YES') : chalk.cyan.bold('no')}`);
  } catch (err) { /* ignore */ }
  try {
    const unpulled = await gitUnpulledChanges();
    console.log(`    - Unpulled changes: ${unpulled !== '0' ? chalk.yellow.bold('YES') : chalk.cyan.bold('no')}`);
  } catch (err) {
    console.log(`    - Unpulled changes: ${chalk.yellow.bold('UNKNOWN (no upstream?)')}`);
  }
  return lastTag;
};

const subpackageStatus = async (opts: Options, lastTag: ?string) => {
  const { src: srcPatterns } = opts;
  const allSpecs = await readAllSpecs(srcPatterns);
  const pkgNames = Object.keys(allSpecs);
  console.log('');
  console.log(`* Subpackage status: [${chalk.cyan.bold(pkgNames.length)} package/s, incl. root]`);
  console.log('');
  console.log(chalk.gray('    Name                                     Version        Private Changes Dependencies'));
  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    const { pkgPath, specs } = allSpecs[pkgName];
    let name = pkgName === ROOT_PACKAGE ? 'Root' : pkgName;
    name = field(name, 40);
    if (pkgName === ROOT_PACKAGE) name = chalk.italic(name);
    const version = chalk.cyan.bold(field(specs.version, 14));
    const isPrivate = specs.private ? chalk.cyan.bold(field('yes', 7)) : chalk.yellow.bold(field('NO', 7));
    let changes;
    if (pkgName !== ROOT_PACKAGE) {
      const diff = await gitDiffSinceIn(lastTag, pkgPath);
      changes = diff !== '' ? chalk.yellow.bold(field(String(diff.split('\n').length), 7)) : chalk.gray(field('-', 7));
    } else {
      changes = chalk.gray(field('N/A', 7));
    }
    const { dependencies, devDependencies } = specs;
    const numDeps = Object.keys(dependencies || {}).length;
    const numDevDeps = Object.keys(devDependencies || {}).length;
    let deps = `${chalk.cyan.bold(numDeps)}`;
    if (numDevDeps) deps += ` (+ ${chalk.cyan.bold(numDevDeps)} dev)`;
    console.log(`    ${name} ${version} ${isPrivate} ${changes} ${deps}`);
  }
};

const field = (str, n) => {
  if (str.length > n) return `${str.slice(0, n - 1)}…`;
  let out = str;
  // inefficient, slow, etc. but doesn't matter in this case, and easy to read
  while (out.length < n) out += ' ';
  return out;
};

export default run;
