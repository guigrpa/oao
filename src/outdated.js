// @flow

import { readAllSpecs } from './utils/readSpecs';
import removeInternalLinks from './utils/removeInternalLinks';
import writeSpecs from './utils/writeSpecs';
import { exec } from './utils/shell';

type Options = {
  src: string,
  link: ?string,
};

const run = async (opts: Options) => {
  const { src: srcPatterns, link: linkPattern } = opts;
  const allSpecs = await readAllSpecs(srcPatterns);
  const pkgNames = Object.keys(allSpecs);
  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    const { pkgPath, specPath, specs: prevSpecs } = allSpecs[pkgName];

    // Rewrite package.json without own/linked packages, run `yarn outdated`, and revert changes
    let fModified = false;
    try {
      const { nextSpecs } = removeInternalLinks(prevSpecs, pkgNames, linkPattern);
      if (nextSpecs !== prevSpecs) {
        writeSpecs(specPath, nextSpecs);
        fModified = true;
      }
      await exec('yarn outdated', { cwd: pkgPath });
    } finally {
      if (prevSpecs != null && fModified) writeSpecs(specPath, prevSpecs);
    }
  }
};

export default run;
