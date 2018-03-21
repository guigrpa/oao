// @flow

/* eslint-disable no-constant-condition */

import { removeAllListeners, addListener } from 'storyboard';
import parallelConsoleListener from 'storyboard-listener-console-parallel';
import type { OaoSpecs } from './types';
import { readAllSpecs } from './readSpecs';
import { exec } from './shell';
import { shortenName, delay, dependsOn } from './helpers';
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
  storySrc?: ?string,
  status: 'idle' | 'running' | 'done',
  pkg: OaoSpecs,
  promise?: Promise<any>,
};
type JobCreator = (specs: Object) => Array<string>;

const DELAY_MAIN_LOOP = 20; // [ms]
const PLACEHOLDER_COMMAND = '__OAO_PLACEHOLDER_COMMAND__';

// ------------------------------------------------
// Main
// ------------------------------------------------
const multiRun = async (
  {
    src,
    ignoreSrc,
    tree: useTree,
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
  const pkgNames = useTree ? calcGraph(allSpecs) : Object.keys(allSpecs);
  for (let i = 0; i < pkgNames.length; i += 1) {
    const pkgName = pkgNames[i];
    const pkg = allSpecs[pkgName];
    const { pkgPath } = pkg;
    const storySrc =
      parallel && !parallelLogs ? shortenName(pkgName, 20) : undefined;
    const commands = getCommandsForSubpackage(pkg.specs);
    if (commands.length) {
      commands.forEach(cmd => {
        allJobs.push({
          cmd,
          cwd: pkgPath,
          bareLogs: !!parallelLogs,
          storySrc,
          status: 'idle',
          pkg,
        });
      });
    } else if (useTree) {
      // Suppose A --> B --> C (where --> means "depends on"),
      // and B generates no jobs, whilst A and C do.
      // Creating a placeholder job for B simplifies getNextJob(),
      // since it will only need to check direct dependencies between
      // subpackages
      allJobs.push({
        cmd: PLACEHOLDER_COMMAND,
        cwd: pkgPath,
        bareLogs: false,
        status: 'idle',
        pkg,
      });
    }
  }

  // Run in serial or parallel mode
  if (!parallel) {
    await runSerially(allJobs, { ignoreErrors });
  } else {
    await runInParallel(allJobs, {
      ignoreErrors,
      parallelLogs,
      parallelLimit,
      useTree,
    });
  }
};

// ------------------------------------------------
// Serial and parallel runners
// ------------------------------------------------
const runSerially = async (allJobs, { ignoreErrors }) => {
  for (let i = 0; i < allJobs.length; i++) {
    const job = allJobs[i];
    executeJob(job, { ignoreErrors });
    await job.promise;
  }
};

const runInParallel = async (
  allJobs,
  { ignoreErrors, parallelLogs, parallelLimit, useTree }
) => {
  const maxConcurrency = parallelLimit || Infinity;
  while (true) {
    // No pending idle jobs? We end the loop; Node will wait for them
    // to finish
    if (getIdleJobs(allJobs).length === 0) break;

    // Get a job!
    const job = getNextJob(allJobs, { useTree });
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
  if (cmd === PLACEHOLDER_COMMAND) {
    job.status = 'done';
    return;
  }
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

const getNextJob = (jobs, { useTree }) => {
  for (let i = 0; i < jobs.length; i++) {
    const candidateJob = jobs[i];
    if (candidateJob.status !== 'idle') continue;
    const { pkg: candidateJobPkg } = candidateJob;
    let isFound = true;
    if (useTree) {
      // Check whether a previous job that hasn't finished
      // belongs to a direct dependency of the candidate (notice
      // that we have _placeholder_ jobs, so we don't need to worry
      // about packages that are indirect dependencies.
      for (let k = 0; k < i; k++) {
        const previousJob = jobs[k];
        if (previousJob.status === 'done') continue;
        const { pkg: previousJobPkg } = previousJob;
        if (dependsOn(candidateJobPkg, previousJobPkg.name)) {
          isFound = false;
          break;
        }
      }
    }
    if (isFound) return candidateJob;
  }
  return null;
};
const getRunningJobs = jobs => jobs.filter(job => job.status === 'running');
const getIdleJobs = jobs => jobs.filter(job => job.status === 'idle');

// ------------------------------------------------
// Public
// ------------------------------------------------
export default multiRun;
