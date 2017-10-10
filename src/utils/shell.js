// @flow

/* eslint-disable no-underscore-dangle */

import path from 'path';
import shell from 'shelljs';
import split from 'split';
import execa from 'execa';
import { mainStory, chalk } from 'storyboard';
import type { StoryT } from 'storyboard';

const cp = (
  src: string,
  dst: string,
  { story = mainStory }: { story?: StoryT } = {}
) => {
  story.debug(`Copying ${chalk.cyan.bold(src)} -> ${chalk.cyan.bold(dst)}...`);
  shell.cp('-rf', path.normalize(src), path.normalize(dst));
};

const mv = (
  src: string,
  dst: string,
  { story = mainStory }: { story?: StoryT } = {}
) => {
  story.debug(`Moving ${chalk.cyan.bold(src)} -> ${chalk.cyan.bold(dst)}...`);
  shell.mv('-rf', path.normalize(src), path.normalize(dst));
};

type ExecOptions = {|
  story?: StoryT,
  createChildStory?: boolean,
  logLevel?: *,
  errorLogLevel?: string,
  ignoreErrorCode?: boolean,
  cwd?: string,
  bareLogs?: boolean,
|};

type ExecResult = {
  code: number,
  stdout: string,
  stderr: string,
};

const exec = async (
  cmd: string,
  {
    story = mainStory,
    createChildStory = true,
    logLevel = 'info',
    errorLogLevel = 'error',
    ignoreErrorCode = false,
    bareLogs = false,
    cwd,
  }: ExecOptions = {}
): Promise<ExecResult> => {
  let title = `Run cmd ${chalk.green.bold(cmd)}`;
  if (cwd) title += ` at ${chalk.green(cwd)}`;
  const ownStory = createChildStory
    ? story.child({ title, level: logLevel })
    : story || mainStory;
  try {
    return await _exec(cmd, {
      cwd,
      story: ownStory,
      errorLogLevel,
      bareLogs,
      ignoreErrorCode,
    });
  } finally {
    if (createChildStory) ownStory.close();
  }
};

const _exec = async (
  cmd,
  { cwd, story, errorLogLevel, bareLogs, ignoreErrorCode }
) => {
  try {
    const prefix = bareLogs ? '' : '| ';
    const cmdName = cmd.split(' ')[0].slice(0, 10);
    const child = execa.shell(cmd, {
      cwd: cwd || '.',
      // Workaround for Node.js bug: https://github.com/nodejs/node/issues/10836
      // See also: https://github.com/yarnpkg/yarn/issues/2462
      stdio:
        process.platform === 'win32' ? ['ignore', 'pipe', 'pipe'] : undefined,
    });
    child.stdout.pipe(split()).on('data', line => {
      story.info(cmdName, `${prefix}${line}`);
    });
    child.stderr.pipe(split()).on('data', line => {
      if (line) story[errorLogLevel](cmdName, `${prefix}${line}`);
    });
    const { code, stdout, stderr } = await child;
    if (code !== 0 && !ignoreErrorCode) {
      throw new Error(buildExecErrorMessage(cmd, cwd, code));
    }
    return { code, stdout, stderr };
  } catch (err) {
    if (err.code && ignoreErrorCode) {
      const { code, stdout, stderr } = err;
      return { code, stdout, stderr };
    }
    const errorMsg = buildExecErrorMessage(cmd, cwd, err.code);
    story[errorLogLevel](errorMsg);
    throw new Error(errorMsg);
  }
};

const buildExecErrorMessage = (cmd, cwd, code) =>
  `Command '${cmd}' failed ${code != null ? `[${code}]` : ''} at ${cwd ||
    "'.'"}`;

export { cp, mv, exec };
