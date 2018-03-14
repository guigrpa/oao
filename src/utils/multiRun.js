// @flow

import { removeAllListeners, addListener } from 'storyboard';
import parallelConsoleListener from 'storyboard-listener-console-parallel';
import { readAllSpecs } from './readSpecs';
import { exec } from './shell';
import { shortenName } from './helpers';
import calcGraph from './calcGraph';

type Options = {
  src: string,
  ignoreSrc?: string,
  tree?: boolean,
  parallel?: boolean,
  parallelLogs?: boolean,
  ignoreErrors?: boolean,
  relativeTime?: boolean,
};

type Job = {
  cmd: string,
  cwd: string,
  bareLogs: ?boolean,
  storySrc: string,
  status: 'idle' | 'running' | 'done',
  pkgName: string,
  preconditions: Array<string>, // jobs for these subpackages should have finished
  promise: Promise<any>,
};
type JobCreator = (specs: Object) => Array<string>;

// ------------------------------------------------
// Main
// ------------------------------------------------
const multiRun = async (
  {
    src,
    ignoreSrc,
    tree,
    parallel,
    parallelLogs,
    ignoreErrors,
    relativeTime,
  }: Options,
  getCommandsForSubpackage: JobCreator
) => {
  if (parallel && parallelLogs) {
    removeAllListeners();
    addListener(parallelConsoleListener, { relativeTime });
  }

  // Gather all jobs
  const allJobs: Array<Job> = [];
  const allSpecs = await readAllSpecs(src, ignoreSrc, false);
  const pkgNames = tree ? calcGraph(allSpecs) : Object.keys(allSpecs);
  for (let i = 0; i < pkgNames.length; i += 1) {
    const pkgName = pkgNames[i];
    const { pkgPath, specs } = allSpecs[pkgName];
    const storySrc =
      parallel && !parallelLogs ? shortenName(pkgName, 20) : undefined;
    // TODO: create pre-conditions
    getCommandsForSubpackage(specs).forEach(cmd => {
      allJobs.push({
        cmd,
        cwd: pkgPath,
        bareLogs: !!parallelLogs,
        storySrc,
        status: 'idle',
        pkgName,
        preconditions: [],
      });
    });
  }

  // Run in serial or parallel mode
  if (!parallel) {
    await runSerially(allJobs, { ignoreErrors });
  } else {
    await runInParallel(allJobs, { ignoreErrors, parallelLogs });
  }
};

// ------------------------------------------------
// Serial and parallel runners
// ------------------------------------------------
const runSerially = async (allJobs, { ignoreErrors }) => {
  for (let i = 0; i < allJobs.length; i++) {
    const { cmd, cwd, bareLogs, storySrc } = allJobs[i];
    let promise = exec(cmd, { cwd, bareLogs, storySrc });
    if (ignoreErrors) promise = promise.catch(() => {});
    await promise;
  }
};

const runInParallel = async (allJobs, { ignoreErrors, parallelLogs }) => {
  const allPromises = [];
  for (let i = 0; i < allJobs.length; i++) {
    const { cmd, cwd, bareLogs, storySrc } = allJobs[i];
    let promise = exec(cmd, { cwd, bareLogs, storySrc });
    if (ignoreErrors) promise = promise.catch(() => {});
    allPromises.push(promise);
  }

  // If parallel logs are enabled, we have to manually exit.
  // We should also show the error again, since the parallel console
  // most probably swallowed it or only showed the final part.
  if (parallelLogs) {
    try {
      await Promise.all(allPromises);
    } catch (err) {
      if (err.stderr) {
        console.error(err.message); // eslint-disable-line
        console.error(err.stderr); // eslint-disable-line
        throw new Error(err.message);
      } else {
        throw err;
      }
    }
    process.exit(0);
  }
};

// ------------------------------------------------
// Public
// ------------------------------------------------
export default multiRun;
