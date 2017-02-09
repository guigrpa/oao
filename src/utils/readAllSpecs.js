import path from 'path';
import fs from 'fs';
import { mainStory } from './storyboard';
import listPaths from './listPaths';

const ROOT_PACKAGE = '__ROOT_PACKAGE__';

const readAllSpecs = async () => {
  const pkgPaths = await listPaths();
  pkgPaths.push('.');
  const allSpecs = {};
  mainStory.info('Reading all package.json files...');
  pkgPaths.forEach((pkgPath) => {
    const pkgName = pkgPath !== '.' ? path.basename(pkgPath) : ROOT_PACKAGE;
    const pkg = { pkgPath };
    try {
      pkg.specPath = path.resolve(process.cwd(), pkgPath, 'package.json');
      pkg.specs = JSON.parse(fs.readFileSync(pkg.specPath, 'utf8'));
    } catch (err) {
      mainStory.error(`Could not read package.json for package ${pkgName}`);
      throw err;
    }
    if (pkgName !== ROOT_PACKAGE && pkg.specs.name !== pkgName) {
      throw new Error('Package name does not match directory name');
    }
    allSpecs[pkgName] = pkg;
  });
  return allSpecs;
};

export default readAllSpecs;
export { ROOT_PACKAGE };
