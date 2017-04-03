// @flow

import path from 'path';
import rimraf from 'rimraf';
import { mainStory, chalk } from 'storyboard';
import { readAllSpecs } from './utils/readSpecs';

type Options = {
  src: string,
  ignoreSrc?: string,
};

const run = async ({ src, ignoreSrc }: Options) => {
  const allSpecs = await readAllSpecs(src, ignoreSrc);
  const pkgNames = Object.keys(allSpecs);
  await Promise.all(
    pkgNames.map(
      pkgName => new Promise((resolve, reject) => {
        const { pkgPath } = allSpecs[pkgName];
        const nodeModulesPath = path.join(pkgPath, 'node_modules');
        mainStory.info(`Removing ${chalk.cyan.bold(nodeModulesPath)}...`);
        rimraf(nodeModulesPath, err => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      })
    )
  );
};

export default run;
