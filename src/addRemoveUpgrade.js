// @flow

import { merge, set as timmSet, setIn } from 'timm';
import { mainStory, chalk } from 'storyboard';
import kebabCase from 'kebab-case';
import { readAllSpecs, readOneSpec, ROOT_PACKAGE } from './utils/readSpecs';
import { DEP_TYPES } from './utils/constants';
import { parseDep } from './utils/helpers';
import removeInternalLinks from './utils/removeInternalLinks';
import writeSpecs from './utils/writeSpecs';
import { exec } from './utils/shell';

const PASS_THROUGH_OPTS = [
  'dev',
  'peer',
  'optional',
  'exact',
  'tilde',
  'ignoreEngines',
];

type Operation = 'add' | 'remove' | 'upgrade';
type Options = {
  src: string,
  ignoreSrc?: string,
  link: ?string,
  dev?: boolean,
  peer?: boolean,
  optional?: boolean,
  exact?: boolean,
  tilde?: boolean,
  ignoreEngines?: boolean,
  workspaces?: any,
};

const run = async (
  pkgName0: string,
  op: Operation,
  deps: Array<string>,
  opts: Options
) => {
  const { src, ignoreSrc, link: linkPattern } = opts;
  const pkgName =
    pkgName0 === '.' || pkgName0 === 'ROOT' ? ROOT_PACKAGE : pkgName0;
  const allSpecs = await readAllSpecs(src, ignoreSrc);
  if (!allSpecs[pkgName]) {
    mainStory.error(`No such package: ${pkgName}`);
    process.exit(1);
  }
  const { pkgPath, specPath, specs: prevSpecs } = allSpecs[pkgName];

  // Very little to do when using yarn workspaces ;)
  if (opts.workspaces) {
    mainStory.info('Using yarn workspaces...');
    const cmd = getYarnCommand(op, deps, opts);
    await exec(cmd, { cwd: pkgPath });
    return;
  }

  // Proceed, the old way
  const pkgNames = Object.keys(allSpecs);

  // Add/remove/upgrade EXTERNAL dependencies:
  // 1. Remove internal links from package.json
  // 2. Run `yarn add/remove/upgrade` as needed (if it fails, revert to original specs and abort)
  // 3. Add the original internal links back to package.json
  const externalDeps = deps.filter(
    dep => !isLinked(pkgNames, linkPattern, dep)
  );
  const externalOperation =
    externalDeps.length || (op === 'upgrade' && !deps.length);
  if (externalOperation) {
    const { nextSpecs, removedPackagesByType } = removeInternalLinks(
      prevSpecs,
      pkgNames,
      linkPattern
    );
    let succeeded = false;
    try {
      if (nextSpecs !== prevSpecs) writeSpecs(specPath, nextSpecs);
      mainStory.info(`Executing 'yarn ${op}'...`);
      const cmd = getYarnCommand(op, externalDeps, opts);
      await exec(cmd, { cwd: pkgPath });
      succeeded = true;
    } catch (err) {
      /* ignore */
    }
    // If unsuccessful, revert to the original specs
    if (!succeeded) {
      if (prevSpecs != null) writeSpecs(specPath, prevSpecs);
      return;
    }
    // Read the updated package.json, and add the internal deps
    const { specs: updatedSpecs } = readOneSpec(pkgPath);
    let finalSpecs = updatedSpecs;
    Object.keys(removedPackagesByType).forEach(type => {
      const removedPackages = removedPackagesByType[type];
      const nextDeps = merge(updatedSpecs[type] || {}, removedPackages);
      finalSpecs = timmSet(finalSpecs, type, nextDeps);
    });
    writeSpecs(specPath, finalSpecs);
  }

  // Add/remove/upgrade INTERNAL dependencies:
  const internalDeps = deps.filter(dep => isLinked(pkgNames, linkPattern, dep));
  const internalOperation =
    internalDeps.length || (op === 'upgrade' && !deps.length);
  if (internalOperation) {
    mainStory.info(`Processing '${op}' on internal dependencies...`);
    const { specs } = readOneSpec(pkgPath);
    let nextSpecs;
    switch (op) {
      case 'add':
        nextSpecs = await addInternal(
          specs,
          internalDeps,
          pkgPath,
          allSpecs,
          opts
        );
        break;
      case 'remove':
        nextSpecs = await removeInternal(specs, internalDeps, pkgPath);
        break;
      case 'upgrade':
        nextSpecs = upgradeInternal(specs, internalDeps, allSpecs, linkPattern);
        break;
      default:
        throw new Error('INVALID_ADD_REMOVE_UPGRADE_COMMAND');
    }
    if (nextSpecs !== prevSpecs) writeSpecs(specPath, nextSpecs);
  }
};

const addInternal = async (prevSpecs, deps, pkgPath, allSpecs, opts) => {
  let nextSpecs = prevSpecs;
  for (let i = 0; i < deps.length; i++) {
    const { name: depName, version: depVersion0 } = parseDep(deps[i]);
    try {
      mainStory.info(`Linking ${chalk.cyan.bold(depName)}...`);
      await exec(`yarn link ${depName}`, {
        cwd: pkgPath,
        logLevel: 'trace',
        errorLogLevel: 'trace',
      });
    } catch (err) {
      /* ignore unlink errors */
    }
    let depType;
    if (opts.dev) depType = 'devDependencies';
    else if (opts.peer) depType = 'peerDependencies';
    else if (opts.optional) depType = 'optionalDependencies';
    else depType = 'dependencies';
    let depVersion = depVersion0;
    if (!depVersion) {
      depVersion = allSpecs[depName] ? allSpecs[depName].specs.version : '*';
      if (depVersion !== '*') {
        if (opts.tilde) depVersion = `~${depVersion}`;
        else if (!opts.exact) depVersion = `^${depVersion}`;
      }
    }
    nextSpecs = setIn(nextSpecs, [depType, depName], depVersion);
  }
  return nextSpecs;
};

const removeInternal = async (prevSpecs, deps, pkgPath) => {
  let nextSpecs = prevSpecs;
  for (let i = 0; i < deps.length; i++) {
    const { name: depName } = parseDep(deps[i]);
    try {
      mainStory.info(`Unlinking ${chalk.cyan.bold(depName)}...`);
      await exec(`yarn unlink ${depName}`, {
        cwd: pkgPath,
        logLevel: 'trace',
        errorLogLevel: 'trace',
      });
    } catch (err) {
      /* ignore unlink errors */
    }
    for (let k = 0; k < DEP_TYPES.length; k++) {
      const type = DEP_TYPES[k];
      if (!nextSpecs[type]) continue;
      nextSpecs = setIn(nextSpecs, [type, depName], undefined);
    }
  }
  return nextSpecs;
};

const upgradeInternal = (prevSpecs, deps, allSpecs, linkPattern) => {
  const pkgNames = Object.keys(allSpecs);
  let nextSpecs = prevSpecs;
  const targetVersions = {};
  deps.forEach(dep => {
    const { name, version } = parseDep(dep);
    targetVersions[name] = version;
  });
  DEP_TYPES.forEach(type => {
    Object.keys(nextSpecs[type] || {}).forEach(depName => {
      if (!isLinked(pkgNames, linkPattern, depName)) return;
      let depVersion = targetVersions[depName];
      if (!depVersion && allSpecs[depName]) {
        depVersion = `^${allSpecs[depName].specs.version}`;
      }
      nextSpecs = setIn(nextSpecs, [type, depName], depVersion);
    });
  });
  return nextSpecs;
};

const isLinked = (pkgNames, linkPattern, dep) => {
  const { name: pkgName } = parseDep(dep);
  if (pkgNames.indexOf(pkgName) >= 0) return true;
  if (linkPattern && new RegExp(linkPattern).test(pkgName)) return true;
  return false;
};

const getYarnCommand = (op, dependencies, options) => {
  let cmd = `yarn ${op}`;
  if (dependencies.length) cmd += ` ${dependencies.join(' ')}`;
  PASS_THROUGH_OPTS.forEach(key => {
    if (options[key]) cmd += ` --${kebabCase(key)}`;
  });
  return cmd;
};

export default run;
