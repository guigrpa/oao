// @flow

import fs from 'fs';
import path from 'path';
import globby from 'globby';

const listPaths = async (
  src: string,
  ignoreSrc?: ?string
): Promise<Array<string>> => {
  const patterns = Array.isArray(src) ? src : [src];
  if (ignoreSrc) patterns.push(`!${ignoreSrc}`);
  const paths = await globby(patterns);
  return paths
    .filter(filePath => {
      try {
        return (
          fs.statSync(path.resolve(process.cwd(), filePath)).isDirectory() &&
          fs.existsSync(path.resolve(process.cwd(), filePath, 'package.json'))
        );
      } catch (err) {
        return false;
      }
    })
    .map(filePath => {
      if (filePath === '/' || filePath[filePath.length - 1] !== '/') {
        return filePath;
      }
      return filePath.slice(0, -1);
    });
};

export default listPaths;
