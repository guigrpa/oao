// @flow

import { merge, set as timmSet } from 'timm';
import { mainStory } from 'storyboard';
import kebabCase from 'kebab-case';
import { readAllSpecs, readOneSpec } from './utils/readSpecs';
import removeInternalLinks from './utils/removeInternalLinks';
import writeSpecs from './utils/writeSpecs';
import { exec } from './utils/shell';

const PASS_THROUGH_OPTS = ['dev', 'peer', 'optional', 'exact', 'tilde', 'ignoreEngines'];

type Operation = 'add' | 'remove' | 'upgrade';
type Options = {
  src: string,
  dev?: boolean,
  peer?: boolean,
  optional?: boolean,
  exact?: boolean,
  tilde?: boolean,
  ignoreEngines?: boolean,
};

const run = async (pkgName: string, op: Operation, deps: Array<string>, opts: Options) => {
  const { src: srcPatterns } = opts;
  const allSpecs = await readAllSpecs(srcPatterns);
  if (!allSpecs[pkgName]) {
    mainStory.error(`No such package: ${pkgName}`);
    process.exit(1);
  }

  const pkgNames = Object.keys(allSpecs);
  const { pkgPath, specPath, specs: prevSpecs } = allSpecs[pkgName];
  let succeeded = false;
  const { nextSpecs, removedPackagesByType } = removeInternalLinks(prevSpecs, pkgNames);
  try {
    if (nextSpecs !== prevSpecs) writeSpecs(specPath, nextSpecs);
    mainStory.info(`Executing 'yarn ${op}'...`);
    let cmd = `yarn ${op}`;
    if (deps.length) cmd += ` ${deps.join(' ')}`;
    PASS_THROUGH_OPTS.forEach((key) => { if (opts[key]) cmd += ` --${kebabCase(key)}`; });
    await exec(cmd, { cwd: pkgPath });
    succeeded = true;
  } catch (err) { /* ignore */ }

  // If not successful, revert to the original specs
  if (!succeeded) {
    if (prevSpecs != null) writeSpecs(specPath, prevSpecs);
    return;
  }

  // Read the updated package.json, and add the internal deps
  const { specs: updatedSpecs } = readOneSpec(pkgPath);
  let finalSpecs = updatedSpecs;
  Object.keys(removedPackagesByType).forEach((type) => {
    const removedPackages = removedPackagesByType[type];
    const nextDeps = merge((updatedSpecs[type] || {}), removedPackages);
    finalSpecs = timmSet(finalSpecs, type, nextDeps);
  });
  writeSpecs(specPath, finalSpecs);
};

export default run;
