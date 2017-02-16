// @flow

import globby from 'globby';

const listPaths = (srcPatterns: string): Promise<Array<string>> => globby(srcPatterns);

export default listPaths;
