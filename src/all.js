// @flow

import { removeAllListeners, addListener } from 'storyboard';
import parallelConsoleListener from 'storyboard-listener-console-parallel';
import { readAllSpecs } from './utils/readSpecs';
import { exec } from './utils/shell';
import { shortenName } from './utils/helpers';
import calcGraph from './utils/calcGraph';

type Options = {
  src: string,
  ignoreSrc?: string,
  tree?: boolean,
  parallel?: boolean,
  parallelLogs?: boolean,
  ignoreErrors?: boolean,
  relativeTime?: boolean,
};

const run = async (
  cmd: string,
  {
    src,
    ignoreSrc,
    tree,
    parallel,
    parallelLogs,
    ignoreErrors,
    relativeTime,
  }: Options
) => {
  if (parallel && parallelLogs) {
    removeAllListeners();
    addListener(parallelConsoleListener, { relativeTime });
  }
  const allSpecs = await readAllSpecs(src, ignoreSrc, false);
  const pkgNames = tree ? calcGraph(allSpecs) : Object.keys(allSpecs);
  const allPromises = [];
  for (let i = 0; i < pkgNames.length; i += 1) {
    const pkgName = pkgNames[i];
    const { pkgPath } = allSpecs[pkgName];
    const storySrc =
      parallel && !parallelLogs ? shortenName(pkgName, 20) : undefined;
    let promise = exec(cmd, { cwd: pkgPath, bareLogs: parallelLogs, storySrc });
    if (ignoreErrors) promise = promise.catch(() => {});
    if (!parallel) {
      await promise;
    } else {
      allPromises.push(promise);
    }
  }

  // If parallel logs are enabled, we have to manually exit.
  // We should also show the error again, since the parallel console
  // most probably swallowed it or only showed the final part.
  if (parallel && parallelLogs) {
    try {
      await Promise.all(allPromises);
    } catch (err) {
      if (err.stderr) {
        console.error(err.message); // eslint-disable-line
        console.error(err.stderr); // eslint-disable-line
        throw new Error(err.message);
      } else {
        throw err;
      }
    }
    process.exit(0);
  }
};

export default run;
