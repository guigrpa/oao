// @flow

import path from 'path';
import { merge } from 'timm';
import semver from 'semver';
import { mainStory, chalk } from 'storyboard';
import { readAllSpecs, ROOT_PACKAGE } from './utils/readSpecs';
import writeSpecs from './utils/writeSpecs';
import { cp } from './utils/shell';

type Options = {
  src: string,
  ignoreSrc?: string,
  copyAttrs: string,
};

const run = async ({ src, ignoreSrc, copyAttrs: copyAttrsStr }: Options) => {
  const allSpecs = await readAllSpecs(src, ignoreSrc);
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
      throw new Error('INVALID_VERSION');
    }
    if (semver.gt(version, masterVersion)) {
      mainStory.error(`Version for ${pkgName} (${chalk.bold(version)}) > master version (${chalk.bold(masterVersion)})`);
      throw new Error('INVALID_VERSION');
    }
  }

  // Copy READMEs to all non-private packages
  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    if (pkgName === ROOT_PACKAGE) continue;
    const { pkgPath, specs } = allSpecs[pkgName];
    if (specs.private) continue;
    const srcFile = pkgName === rootSpecs.name ? 'README.md' : 'README-LINK.md';
    const dstFile = path.join(pkgPath, 'README.md');
    cp(srcFile, dstFile);
  }

  // Merge common attributes with submodules
  const commonSpecs = {};
  const copyAttrs = copyAttrsStr.split(/\s*,\s*/);
  copyAttrs.forEach((attr) => { commonSpecs[attr] = rootSpecs[attr]; });
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
