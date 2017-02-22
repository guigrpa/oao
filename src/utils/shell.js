// @flow

/* eslint-disable no-underscore-dangle */

import path from 'path';
import shell from 'shelljs';
import split from 'split';
import { mainStory, chalk } from 'storyboard';
import type { StoryT } from 'storyboard';

const cp = (src: string, dst: string, { story = mainStory }: { story?: StoryT } = {}) => {
  story.debug(`Copying ${chalk.cyan.bold(src)} -> ${chalk.cyan.bold(dst)}...`);
  shell.cp('-rf', path.normalize(src), path.normalize(dst));
};

const mv = (src: string, dst: string, { story = mainStory }: { story?: StoryT } = {}) => {
  story.debug(`Moving ${chalk.cyan.bold(src)} -> ${chalk.cyan.bold(dst)}...`);
  shell.mv('-rf', path.normalize(src), path.normalize(dst));
};

type ExecOptions = {|
  story?: StoryT,
  logLevel?: *,
  errorLogLevel?: string,
  cwd?: string,
  bareLogs?: boolean,
|};

type ExecResult = {
  code: number,
  stdout: string,
  stderr: string,
};

const exec = async (cmd: string, {
  story = mainStory,
  logLevel = 'info',
  errorLogLevel = 'error',
  bareLogs = false,
  cwd,
}: ExecOptions = {}): Promise<ExecResult> => {
  let title = `Run cmd ${chalk.green.bold(cmd)}`;
  if (cwd) title += ` at ${chalk.green(cwd)}`;
  const ownStory = story.child({ title, level: logLevel });
  try {
    return await _exec(cmd, { cwd, story: ownStory, errorLogLevel, bareLogs });
  } finally {
    ownStory.close();
  }
};

const _exec = (cmd, { cwd, story, errorLogLevel, bareLogs }) => new Promise((resolve, reject) => {
  const prefix = bareLogs ? '' : '| ';
  const child = shell.exec(cmd, { cwd, silent: true }, (code, stdout, stderr) => {
    if (code !== 0) {
      story[errorLogLevel](`Command '${cmd}' failed at ${cwd || '\'.\''} [${code}]`);
      reject(new Error(`Command failed: ${cmd}`));
      return;
    }
    story.trace('Command completed successfully');
    resolve({ code, stdout, stderr });
  });
  const cmdName = cmd.split(' ')[0].slice(0, 10);
  child.stdout.pipe(split()).on('data', (line) => {
    story.info(cmdName, `${prefix}${line}`);
  });
  child.stderr.pipe(split()).on('data', (line) => {
    if (line) story[errorLogLevel](cmdName, `${prefix}${line}`);
  });
});

export {
  cp, mv,
  exec,
};
