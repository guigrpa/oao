// @flow

import type { AllSpecs, OaoSpecs } from './types';
import { DEP_TYPES } from './constants';

const calcGraph = (allSpecs: AllSpecs): Array<string> => {
  const out = [];
  const pkgNames = Object.keys(allSpecs);
  if (!pkgNames.length) return out;

  // Build virtual root node
  const virtualRootDeps = {};
  pkgNames.forEach(name => {
    virtualRootDeps[name] = true;
  });
  const virtualRootNode: any = {
    name: '__VIRTUAL_ROOT__',
    specs: { dependencies: virtualRootDeps },
  };

  // Build graph starting from virtual root node, then remove it
  buildGraph(allSpecs, virtualRootNode, pkgNames, out);
  return out.slice(0, out.length - 1);
};

export const calcGraphAndReturnAsAllSpecs = (allSpecs: AllSpecs): AllSpecs => {
  const newAllSpecs = {};
  const orderedPackages = calcGraph(allSpecs);
  orderedPackages.forEach(pkg => {
    newAllSpecs[pkg] = allSpecs[pkg];
  });
  return newAllSpecs;
};

const buildGraph = (
  allSpecs: AllSpecs,
  pkg: OaoSpecs,
  pkgNames: Array<string>,
  out: Array<string>,
  visited?: Array<string> = []
) => {
  const { name } = pkg;
  visited.push(name);
  const internalDeps = getInternalDeps(pkg, pkgNames);
  for (let i = 0; i < internalDeps.length; i++) {
    const depName = internalDeps[i];
    if (visited.indexOf(depName) >= 0) continue;
    buildGraph(allSpecs, allSpecs[depName], pkgNames, out, visited);
  }
  out.push(name);
};

const getInternalDeps = (pkg: OaoSpecs, pkgNames: Array<string>) => {
  const { specs } = pkg;
  const internalDeps = {};
  for (let i = 0; i < DEP_TYPES.length; i++) {
    const depType = DEP_TYPES[i];
    const deps = specs[depType] || {};
    const depNames = Object.keys(deps);
    for (let k = 0; k < depNames.length; k++) {
      const pkgName = depNames[k];
      if (pkgNames.indexOf(pkgName) >= 0) internalDeps[pkgName] = true;
    }
  }
  return Object.keys(internalDeps);
};

export default calcGraph;
