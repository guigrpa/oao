// @flow

/* eslint-disable no-constant-condition */

import { removeAllListeners, addListener } from 'storyboard';
import parallelConsoleListener from 'storyboard-listener-console-parallel';
import { readAllSpecs } from './readSpecs';
import { exec } from './shell';
import { shortenName, delay } from './helpers';
import calcGraph from './calcGraph';

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

type Job = {
  cmd: string,
  cwd: string,
  bareLogs: boolean,
  storySrc: ?string,
  status: 'idle' | 'running' | 'done',
  pkgName: string,
  preconditions: Array<string>, // jobs for these subpackages should have finished
  promise?: Promise<any>,
};
type JobCreator = (specs: Object) => Array<string>;

const DELAY_MAIN_LOOP = 20; // [ms]

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
    parallelLimit,
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
    await runInParallel(allJobs, { ignoreErrors, parallelLogs, parallelLimit });
  }
};

// ------------------------------------------------
// Serial and parallel runners
// ------------------------------------------------
const runSerially = async (allJobs, { ignoreErrors }) => {
  for (let i = 0; i < allJobs.length; i++) {
    await executeJob(allJobs[i], { ignoreErrors });
  }
};

const runInParallel = async (
  allJobs,
  { ignoreErrors, parallelLogs, parallelLimit }
) => {
  const maxConcurrency = parallelLimit || Infinity;
  while (true) {
    // No pending idle jobs? We end the loop; Node will wait for them
    // to finish
    if (getIdleJobs(allJobs).length === 0) break;

    // Get a job!
    const job = getNextJob(allJobs);
    if (job) {
      if (getRunningJobs(allJobs).length >= maxConcurrency) {
        await delay(DELAY_MAIN_LOOP);
        continue;
      }
      executeJob(job, { ignoreErrors });
    } else {
      // We still have pending jobs, but cannot run yet (they depend on
      // others). Wait a bit...
      await delay(DELAY_MAIN_LOOP);
    }
  }

  // If parallel logs are enabled, we have to manually exit (`process.exit`).
  // We should also show the error again, since the parallel console
  // most probably swallowed it or only showed the final part.
  if (parallelLogs) {
    const pendingPromises = allJobs
      .filter(o => o.status !== 'done')
      .map(job => job.promise);
    try {
      await Promise.all(pendingPromises);
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
// Helpers
// ------------------------------------------------
/* eslint-disable no-param-reassign */
const executeJob = (job, { ignoreErrors }) => {
  job.promise = _executeJob(job, { ignoreErrors });
};

const _executeJob = async (job, { ignoreErrors }) => {
  const { cmd, cwd, bareLogs, storySrc } = job;
  const promise = exec(cmd, { cwd, bareLogs, storySrc });
  job.status = 'running';
  try {
    await promise;
    job.status = 'done';
  } catch (err) {
    job.status = 'done';
    if (!ignoreErrors) throw err;
  }
};
/* eslint-enable no-param-reassign */

const getNextJob = jobs => jobs.find(job => job.status === 'idle');
const getRunningJobs = jobs => jobs.filter(job => job.status === 'running');
const getIdleJobs = jobs => jobs.filter(job => job.status === 'idle');

// ------------------------------------------------
// Public
// ------------------------------------------------
export default multiRun;
