import path from 'path';
import { merge } from 'timm';
import semver from 'semver';
import { mainStory, chalk } from 'storyboard';
import readAllSpecs, { ROOT_PACKAGE } from './utils/readAllSpecs';
import writeSpecs from './utils/writeSpecs';
import { cp } from './utils/helpers';

const COPY_SPECS = [
  'description', 'keywords',
  'author', 'license',
  'homepage', 'bugs', 'repository',
];

const run = async ({ src: srcPatterns }) => {
  const allSpecs = await readAllSpecs(srcPatterns);
  const pkgNames = Object.keys(allSpecs);
  const rootSpecs = allSpecs[ROOT_PACKAGE].specs;

  // Check version numbers!
  const masterVersion = rootSpecs.version;
  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    if (pkgName === ROOT_PACKAGE) continue;
    const { specs } = allSpecs[pkgName];
    const { version } = specs;
    if (specs.private) continue;
    if (!semver.valid(version)) {
      mainStory.error(`Invalid version for ${chalk.bold(pkgName)}: ${chalk.bold(version)}`);
      process.exit(1);
    }
    if (semver.gt(version, masterVersion)) {
      mainStory.error(`Version for ${pkgName} (${chalk.bold(version)}) > master version (${chalk.bold(masterVersion)})`);
      process.exit(1);
    }
  }

  // Copy READMEs to all non-private packages
  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    if (pkgName === ROOT_PACKAGE) continue;
    const { pkgPath, specs } = allSpecs[pkgName];
    if (specs.private) continue;
    const src = pkgName === rootSpecs.name ? 'README.md' : 'README-LINK.md';
    const dst = path.join(pkgPath, 'README.md');
    cp(src, dst);
  }

  // Merge common attributes with submodules
  const commonSpecs = {};
  COPY_SPECS.forEach((attr) => { commonSpecs[attr] = rootSpecs[attr]; });
  mainStory.info('Updating package attributes', { attach: commonSpecs });
  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    if (pkgName === ROOT_PACKAGE) continue;
    const { specPath, specs: prevSpecs } = allSpecs[pkgName];
    if (prevSpecs.private) continue;
    const nextSpecs = merge(prevSpecs, commonSpecs);
    writeSpecs(specPath, nextSpecs);
  }

  mainStory.warn('Please make sure you commit all changes before you attempt "oao publish"');
};

export default run;
