// @flow

import { removeAllListeners, addListener } from 'storyboard';
import listPaths from './utils/listPaths';
import { exec } from './utils/shell';
import parallelConsoleListener from './utils/parallelConsoleListener';

type Options = {
  src: string,
  parallel?: boolean,
  parallelLogs?: boolean,
  ignoreErrors?: boolean,
};

const run = async (cmd: string, {
  src: srcPatterns,
  parallel,
  parallelLogs,
  ignoreErrors,
}: Options) => {
  if (parallel && parallelLogs) {
    removeAllListeners();
    addListener(parallelConsoleListener);
  }
  const pkgPaths = await listPaths(srcPatterns);
  const allPromises = [];
  for (let i = 0; i < pkgPaths.length; i += 1) {
    let promise = exec(cmd, { cwd: pkgPaths[i], bareLogs: parallelLogs });
    if (ignoreErrors) promise = promise.catch(() => {});
    if (!parallel) {
      await promise;
    } else {
      allPromises.push(promise);
    }
  }

  // If parallel logs are enabled, we have to manually exit
  if (parallel && parallelLogs) {
    await Promise.all(allPromises);
    process.exit(0);
  }
};

export default run;
