// @flow

import multiRun from './utils/multiRun';

type Options = {
  src: string,
  ignoreSrc?: string,
  tree?: boolean,
  parallel?: boolean,
  parallelLogs?: boolean,
  ignoreErrors?: boolean,
};

const run = (script: string, options: Options) =>
  multiRun(options, specs => {
    if (!specs.scripts || !specs.scripts[script]) return null;
    return `yarn run ${script}`;
  });

export default run;
