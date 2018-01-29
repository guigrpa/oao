// @flow

import path from 'path';
import fs from 'fs';
import { mainStory } from 'storyboard';
import type { OaoSpecs, AllSpecs } from './types';
import listPaths from './listPaths';

const ROOT_PACKAGE = '__ROOT_PACKAGE__';

const readAllSpecs = async (
  src: string | Array<string>,
  ignoreSrc?: ?string,
  includeRootPkg: boolean = true
): Promise<AllSpecs> => {
  const pkgPaths = await listPaths(src, ignoreSrc);
  if (includeRootPkg) pkgPaths.push('.');
  const allSpecs = {};
  mainStory.info('Reading all package.json files...');
  pkgPaths.forEach(pkgPath => {
    const pkg = readOneSpec(pkgPath);
    allSpecs[pkg.name] = pkg;
  });
  return allSpecs;
};

const readOneSpec = (pkgPath: string): OaoSpecs => {
  const pkg = {};
  pkg.pkgPath = pkgPath;
  try {
    pkg.specPath = path.resolve(process.cwd(), pkgPath, 'package.json');
    pkg.specs = JSON.parse(fs.readFileSync(pkg.specPath, 'utf8'));
  } catch (err) {
    mainStory.error(`Could not read package.json at ${pkg.specPath}`);
    throw err;
  }
  const name = pkgPath === '.' ? ROOT_PACKAGE : pkg.specs.name;
  validatePkgName(pkgPath, name);
  pkg.name = name;
  pkg.displayName = name === ROOT_PACKAGE ? 'MONOREPO ROOT' : name;
  return pkg;
};

const validatePkgName = (pkgPath: string, name: string): void => {
  if (name == null || name === '') {
    throw new Error(`Package has no name (${pkgPath})`);
  }
  if (pkgPath === '.') return;
  const segments = pkgPath.split('/');
  if (name[0] !== '@' && name !== segments[segments.length - 1]) {
    const errMsg = `Package name (${name}) does not match directory name ${
      pkgPath
    }`;
    mainStory.error(errMsg);
    const err = new Error('INVALID_DIR_NAME');
    // $FlowFixMe (piggyback on exception)
    err.details = errMsg;
    throw err;
  }
};

export { readAllSpecs, readOneSpec, ROOT_PACKAGE };
