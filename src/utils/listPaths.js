// @flow

import fs from 'fs';
import path from 'path';
import globby from 'globby';

const listPaths = async (srcPatterns: string): Promise<Array<string>> => {
  const paths = await globby(srcPatterns);
  return paths.filter((filePath) => {
    try {
      return fs.statSync(path.resolve(process.cwd(), filePath)).isDirectory();
    } catch (err) { return false; }
  })
  .map((filePath) => {
    if (filePath === '/' || filePath[filePath.length - 1] !== '/') return filePath;
    return filePath.slice(0, -1);
  });
};

export default listPaths;
