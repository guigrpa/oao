/* eslint-disable no-underscore-dangle */

import path from 'path';
import shell from 'shelljs';
import split from 'split';
import { mainStory, chalk } from './storyboard';

const cd = (dir, { story = mainStory } = {}) => {
  story.trace(`Changing working directory to ${chalk.cyan.bold(dir)}...`);
  shell.cd(dir);
};

const cp = (src, dst, { story = mainStory } = {}) => {
  story.debug(`Copying ${chalk.cyan.bold(src)} -> ${chalk.cyan.bold(dst)}...`);
  shell.cp('-rf', path.normalize(src), path.normalize(dst));
};

const mv = (src, dst, { story = mainStory } = {}) => {
  story.debug(`Moving ${chalk.cyan.bold(src)} -> ${chalk.cyan.bold(dst)}...`);
  shell.mv('-rf', path.normalize(src), path.normalize(dst));
};

const exec = async (cmd, {
  story = mainStory,
  logLevel = 'info',
  errorLogLevel = 'error',
  cwd,
} = {}) => {
  const prevWd = shell.pwd();
  let title = `Run cmd ${chalk.green.bold(cmd)}`;
  if (cwd) title += ` at ${chalk.green(cwd)}`;
  const ownStory = story.child({ title, level: logLevel });
  try {
    if (cwd) cd(cwd, { story });
    const result = await _exec(cmd, { story: ownStory, errorLogLevel });
    if (cwd) cd(prevWd, { story });
    return result;
  } finally {
    ownStory.close();
  }
};

const _exec = (cmd, { story, errorLogLevel }) => new Promise((resolve, reject) => {
  const child = shell.exec(cmd, { silent: true }, (code, stdout, stderr) => {
    if (code !== 0) {
      story[errorLogLevel](`Command failed [${code}]`);
      reject(new Error(`Command failed: ${cmd}`));
      return;
    }
    story.trace('Command completed successfully');
    resolve({ code, stdout, stderr });
  });
  const cmdName = cmd.split(' ')[0].slice(0, 10);
  child.stdout.pipe(split()).on('data', (line) => {
    story.info(cmdName, `| ${line}`);
  });
  child.stderr.pipe(split()).on('data', (line) => {
    if (line) story[errorLogLevel](cmdName, `| ${line}`);
  });
});

export {
  cd,
  cp, mv,
  exec,
};
