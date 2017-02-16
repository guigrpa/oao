// @flow

import { omit, set as timmSet } from 'timm';

const DEP_TYPES = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

type PkgVersionMap = { [pkgName: string]: string };

const removeInternalLinks = (prevSpecs: Object, pkgNames: Array<string>): {
  nextSpecs: Object,
  removedPackagesByType: { [key: string]: PkgVersionMap },
  allRemovedPackages: PkgVersionMap,
} => {
  const removedPackagesByType = {};
  const allRemovedPackages = {};

  let nextSpecs = prevSpecs;
  DEP_TYPES.forEach((type) => {
    const prevDeps = nextSpecs[type];
    if (prevDeps == null) return;
    let nextDeps = prevDeps;
    pkgNames.forEach((name) => {
      const version = nextDeps[name];
      if (version == null) return;
      nextDeps = omit(nextDeps, [name]);
      if (!removedPackagesByType[type]) removedPackagesByType[type] = {};
      removedPackagesByType[type][name] = version;
      allRemovedPackages[name] = version;
    });
    nextSpecs = timmSet(nextSpecs, type, nextDeps);
  });

  return {
    nextSpecs,
    removedPackagesByType,
    allRemovedPackages,
  };
};

export default removeInternalLinks;
