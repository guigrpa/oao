// @flow

import listPaths from './utils/listPaths';
import { exec } from './utils/shell';

type Options = { src: string };

const run = async (cmd: string, { src: srcPatterns }: Options) => {
  const pkgPaths = await listPaths(srcPatterns);
  for (let i = 0; i < pkgPaths.length; i += 1) {
    await exec(cmd, { cwd: pkgPaths[i] });
  }
};

export default run;
