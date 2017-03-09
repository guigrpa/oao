// @flow

import { mainStory, chalk } from 'storyboard';
import semver from 'semver';
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
    const story = mainStory.child({
      title: `Outdated dependencies in ${chalk.cyan.bold(pkgName)}`,
      level: 'info',
    });

    // Rewrite package.json without own/linked packages, run `yarn outdated`, and revert changes
    let fModified = false;
    let allRemovedPackages;
    try {
      const tmp = removeInternalLinks(prevSpecs, pkgNames, linkPattern);
      const { nextSpecs } = tmp;
      allRemovedPackages = tmp.allRemovedPackages;
      if (nextSpecs !== prevSpecs) {
        writeSpecs(specPath, nextSpecs);
        fModified = true;
      }
      await exec('yarn outdated',
        { cwd: pkgPath, story, createChildStory: false, logLevel: 'trace' });
    } catch (err) {
      story.close();
      throw err;
    } finally {
      if (prevSpecs != null && fModified) writeSpecs(specPath, prevSpecs);
    }

    // Log warnings when linked sub-packages do not match the specified range
    try {
      Object.keys(allRemovedPackages).forEach(depName => {
        const depVersionRange = allRemovedPackages[depName];
        const depSpecs = allSpecs[depName];
        if (!depSpecs) return; // might not exist, if it's a custom link
        const depActualVersion = depSpecs.specs.version;
        if (!semver.satisfies(depActualVersion, depVersionRange)) {
          story.warn(`| - Warning: ${chalk.cyan.bold(`${depName}@${depActualVersion}`)} ` +
            `does not satisfy the specified range: ${chalk.cyan.bold(depVersionRange)}`);
        }
      });
    } finally {
      story.close();
    }
  }
};

export default run;
