import listPaths from './utils/listPaths';
import { exec } from './utils/shell';

const run = async (cmd, { src: srcPatterns }) => {
  const pkgPaths = await listPaths(srcPatterns);
  for (let i = 0; i < pkgPaths.length; i += 1) {
    await exec(cmd, { cwd: pkgPaths[i] });
  }
};

export default run;
