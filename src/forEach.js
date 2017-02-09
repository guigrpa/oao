import listPaths from './utils/listPaths';
import { exec } from './utils/helpers';

const run = async (cmd) => {
  const pkgPaths = await listPaths();
  for (let i = 0; i < pkgPaths.length; i += 1) {
    await exec(cmd, { cwd: pkgPaths[i] });
  }
};

export default run;
