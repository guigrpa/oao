// @flow

import { set as timmSet, omit } from 'timm';
import { readAllSpecs } from './utils/readSpecs';
import { DEP_TYPES } from './utils/constants';
import { parseDep } from './utils/helpers';
import writeSpecs from './utils/writeSpecs';

type Options = {
  src: string,
  ignoreSrc?: string,
  link: ?string,
};

const run = async (deps: Array<string>, opts: Options) => {
  const { src, ignoreSrc } = opts;
  const allSpecs = await readAllSpecs(src, ignoreSrc);
  const pkgNames = Object.keys(allSpecs);

  // Update all package.json files with this version
  pkgNames.forEach(pkgName => {
    const { specPath, specs: prevSpecs } = allSpecs[pkgName];
    let nextSpecs = prevSpecs;
    deps.forEach(dep => {
      const { name: depName } = parseDep(dep);
      DEP_TYPES.forEach(type => {
        const depsOfType = nextSpecs[type] || {};
        if (depsOfType[depName] != null) {
          const nextDeps = omit(depsOfType, [depName]);
          nextSpecs = timmSet(nextSpecs, type, nextDeps);
        }
      });
    });
    if (nextSpecs !== prevSpecs) writeSpecs(specPath, nextSpecs);
  });
};

export default run;
