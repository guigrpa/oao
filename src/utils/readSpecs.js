// @flow

import path from 'path';
import fs from 'fs';
import { mainStory } from 'storyboard';
import listPaths from './listPaths';

const ROOT_PACKAGE = '__ROOT_PACKAGE__';

type PackageName = string;
type OaoSpecs = {
  pkgPath: string,
  specPath: string,  // including .package.json
  name: string,
  displayName: string,
  specs: Object,
};
type AllSpecs = { [key: PackageName]: OaoSpecs };

const readAllSpecs = async (srcPatterns: string): Promise<AllSpecs> => {
  const pkgPaths = await listPaths(srcPatterns);
  pkgPaths.push('.');
  const allSpecs = {};
  mainStory.info('Reading all package.json files...');
  pkgPaths.forEach((pkgPath) => {
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
  const displayName = name === ROOT_PACKAGE ? 'ROOT' : name;
  pkg.displayName = displayName;
  return pkg;
};

const validatePkgName = (pkgPath: string, name: PackageName): void => {
  if (name == null || name === '') throw new Error(`Package has no name (${pkgPath})`);
  if (pkgPath === '.') return;
  const segments = pkgPath.split('/');
  if (name[0] !== '@' && name !== segments[segments.length - 1]) {
    mainStory.error(`Package name (${name}) does not match directory name ${pkgPath}`);
    throw new Error('INVALID_DIR_NAME');
  }
};

export {
  readAllSpecs,
  readOneSpec,
  ROOT_PACKAGE,
};
