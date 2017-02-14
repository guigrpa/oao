import { merge, set as timmSet } from 'timm';
import { mainStory, chalk } from 'storyboard';
import { readAllSpecs, readOneSpec } from './utils/readSpecs';
import removeInternalLinks from './utils/removeInternalLinks';
import writeSpecs from './utils/writeSpecs';
import { exec } from './utils/helpers';

const PASS_THROUGH_OPTS = ['dev', 'peer', 'optional', 'exact', 'tilde'];

const run = async (pkgName, op, deps, opts) => {
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
    mainStory.info(`Installing ${chalk.yellow.bold(deps.join(', '))}...`);
    let cmd = `yarn ${op} ${deps.join(' ')}`;
    PASS_THROUGH_OPTS.forEach((key) => { if (opts[key]) cmd += ` --${key}`; });
    await exec(cmd, { cwd: pkgPath });
    succeeded = true;
  } catch (err) { /* ignore */ }

  // If not successful, revert to the original specs
  if (!succeeded) {
    if (prevSpecs != null) writeSpecs(specPath, prevSpecs);
    return;
  }

  // Read the updated package.json, and add the internal deps
  const { specs: updatedSpecs } = readOneSpec(pkgName, pkgPath);
  let finalSpecs = updatedSpecs;
  Object.keys(removedPackagesByType).forEach((type) => {
    const removedPackages = removedPackagesByType[type];
    const nextDeps = merge((updatedSpecs[type] || {}), removedPackages);
    finalSpecs = timmSet(finalSpecs, type, nextDeps);
  });
  writeSpecs(specPath, finalSpecs);
};

export default run;
