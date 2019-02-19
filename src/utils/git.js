// @flow

import { exec } from './shell';

const gitLastTag = async (): Promise<?string> => {
  try {
    let { stdout: commit } = await exec('git rev-list --tags --max-count=1', {
      logLevel: 'trace',
      errorLogLevel: 'info',
    });
    commit = commit.trim();
    if (commit === '') return null;
    let { stdout: tag } = await exec(`git describe --tags ${commit}`, {
      logLevel: 'trace',
    });
    tag = tag.trim();
    tag = tag !== '' ? tag : null;
    return tag;
  } catch (err) {
    return null;
  }
};

const gitCurBranch = async (): Promise<string> => {
  const { stdout } = await exec('git symbolic-ref --short HEAD', {
    logLevel: 'trace',
  });
  return stdout.trim();
};

const gitUncommittedChanges = async (): Promise<string> => {
  const { stdout } = await exec('git status --porcelain', {
    logLevel: 'trace',
  });
  return stdout.trim();
};

// Ripped off from: https://github.com/sindresorhus/np/blob/master/lib/git.js
const gitUnpulledChanges = async (): Promise<string> => {
  const { stdout } = await exec(
    'git rev-list --count --left-only @{u}...HEAD',
    {
      logLevel: 'trace',
    }
  );
  return stdout.trim();
};

const gitDiffSinceIn = async (
  sinceTag: ?string,
  inPath: string
): Promise<string> => {
  if (sinceTag == null) return 'CHANGED';
  const { stdout } = await exec(
    `git diff --name-only ${sinceTag} -- ${inPath}`,
    {
      logLevel: 'trace',
    }
  );
  return stdout.trim();
};

const gitCommitChanges = async (msg: string): Promise<void> => {
  await exec('git add .', { logLevel: 'trace' });
  await exec(`git commit -m ${msg}`, { logLevel: 'trace' });
};

const gitAddTag = async (tag: string): Promise<void> => {
  await exec(`git tag ${tag}`, { logLevel: 'trace' });
};

const gitPushWithTags = async (): Promise<void> => {
  await exec('git push --quiet', { logLevel: 'trace' });
  await exec('git push --tags --quiet', { logLevel: 'trace' });
};

export {
  gitLastTag,
  gitCurBranch,
  gitUncommittedChanges,
  gitUnpulledChanges,
  gitDiffSinceIn,
  gitCommitChanges,
  gitAddTag,
  gitPushWithTags,
};
