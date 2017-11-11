// @flow

import { removeAllListeners, addListener } from 'storyboard';
import parallelConsoleListener from 'storyboard-listener-console-parallel';

import { readAllSpecs } from './utils/readSpecs';
import { exec } from './utils/shell';

type Options = {
  src: string,
  ignoreSrc?: string,
  parallel?: boolean,
  parallelLogs?: boolean,
  ignoreErrors?: boolean,
};

const run = async (
  script: string,
  { src, ignoreSrc, parallel, parallelLogs, ignoreErrors }: Options
) => {
  if (parallel && parallelLogs) {
    removeAllListeners();
    addListener(parallelConsoleListener);
  }
  const allSpecs = await readAllSpecs(src, ignoreSrc, false);
  const allPromises = [];
  const pkgNames = Object.keys(allSpecs);
  for (let i = 0; i < pkgNames.length; i++) {
    const pkgName = pkgNames[i];
    const { pkgPath, specs: prevSpecs } = allSpecs[pkgName];
    if (prevSpecs.scripts && prevSpecs.scripts[script]) {
      let promise = exec(`yarn run ${script}`, {
        cwd: pkgPath,
        bareLogs: parallelLogs,
      });
      if (ignoreErrors) promise = promise.catch(() => {});
      if (!parallel) {
        await promise;
      } else {
        allPromises.push(promise);
      }
    }
  }

  // If parallel logs are enabled, we have to manually exit
  if (parallel && parallelLogs) {
    await Promise.all(allPromises);
    process.exit(0);
  }
};

export default run;
