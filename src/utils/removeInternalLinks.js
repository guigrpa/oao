// @flow

import { omit, set as timmSet } from 'timm';
import { DEP_TYPES } from './constants';

type PkgVersionMap = { [pkgName: string]: string };

const removeInternalLinks = (
  prevSpecs: Object,
  pkgNames: Array<string>,
  linkPattern: ?string
): {
  nextSpecs: Object,
  removedPackagesByType: { [key: string]: PkgVersionMap },
  allRemovedPackages: PkgVersionMap,
} => {
  const removedPackagesByType = {};
  const allRemovedPackages = {};
  const regex = linkPattern ? new RegExp(linkPattern) : null;

  let nextSpecs = prevSpecs;
  DEP_TYPES.forEach(type => {
    const prevDeps = nextSpecs[type];
    if (prevDeps == null) return;
    let nextDeps = prevDeps;
    Object.keys(prevDeps).forEach(name => {
      // Is package to be removed? Only if it belongs to the internal
      // subpackage list (`pkgNames`) or it matches the custom `linkPattern`
      const fRemove =
        pkgNames.indexOf(name) >= 0 || (regex != null && regex.test(name));
      if (!fRemove) return;
      const version = prevDeps[name];
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
