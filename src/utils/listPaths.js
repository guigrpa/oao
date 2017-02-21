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
  });
};

export default listPaths;
