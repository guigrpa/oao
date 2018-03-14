// @flow

import multiRun from './utils/multiRun';

type Options = {
  src: string,
  ignoreSrc?: string,
  tree?: boolean,
  parallel?: boolean,
  parallelLogs?: boolean,
  parallelLimit?: number,
  ignoreErrors?: boolean,
  relativeTime?: boolean,
};

const run = (cmd: string, options: Options) => multiRun(options, () => [cmd]);

export default run;
