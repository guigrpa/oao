// @flow

import { setIn } from 'timm';
import { mainStory } from 'storyboard';
import { readAllSpecs } from './utils/readSpecs';
import { DEP_TYPES } from './utils/constants';
import { parseDep } from './utils/helpers';
import writeSpecs from './utils/writeSpecs';
import { exec } from './utils/shell';

type Options = {
  src: string,
  ignoreSrc?: string,
  link: ?string,
};

const run = async (deps: Array<string>, opts: Options) => {
  const { src, ignoreSrc, link: linkPattern } = opts;
  const allSpecs = await readAllSpecs(src, ignoreSrc);
  const pkgNames = Object.keys(allSpecs);

  // Determine correct version for each dep
  const versions = {};
  for (let i = 0; i < deps.length; i++) {
    const dep = deps[i];
    const { name, version } = parseDep(dep);
    let finalVersion = version;
    if (!finalVersion) {
      if (pkgNames.indexOf(dep) >= 0) {
        finalVersion = `^${allSpecs[dep].specs.version}`;
      } else if (linkPattern && new RegExp(linkPattern).test(dep)) {
        finalVersion = '*';
      } else {
        const { stdout } = await exec(`npm info ${dep} version`, {
          logLevel: 'trace',
        });
        finalVersion = `^${stdout.trim()}`;
      }
    }
    versions[name] = finalVersion;
  }
  mainStory.info('New versions of these packages:', { attach: versions });

  // Update all package.json files with this version
  pkgNames.forEach(pkgName => {
    const { specPath, specs: prevSpecs } = allSpecs[pkgName];
    deps.forEach(depName => {
      let nextSpecs = prevSpecs;
      DEP_TYPES.forEach(type => {
        const depsOfType = nextSpecs[type] || {};
        if (depsOfType[depName] != null) {
          nextSpecs = setIn(nextSpecs, [type, depName], versions[depName]);
        }
      });
      if (nextSpecs !== prevSpecs) writeSpecs(specPath, nextSpecs);
    });
  });
};

export default run;
