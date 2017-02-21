// @flow

import listPaths from './utils/listPaths';
import { exec } from './utils/shell';

type Options = {
  src: string,
  parallel?: boolean,
  ignoreErrors?: boolean,
};

const run = async (cmd: string, { src: srcPatterns, parallel, ignoreErrors }: Options) => {
  const pkgPaths = await listPaths(srcPatterns);
  for (let i = 0; i < pkgPaths.length; i += 1) {
    let promise = exec(cmd, { cwd: pkgPaths[i] });
    if (ignoreErrors) promise = promise.catch(() => {});
    if (!parallel) await promise;
  }
};

export default run;
