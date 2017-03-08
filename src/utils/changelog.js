// @flow

import fs from 'fs';
import { mainStory, chalk } from 'storyboard';

type Options = {
  changelogPath: string,
  version: string,
  // Unit tests
  _date?: ?Object,
};

const addVersionLine = ({ changelogPath, version, _date }: Options) => {
  let contents;
  try {
    contents = fs.readFileSync(changelogPath, 'utf8');
  } catch (err) {
    mainStory.warn(`Could not find changelog (${chalk.cyan.bold(changelogPath)}). Skipped update`);
    return;
  }

  const date = _date || new Date();
  const line = `## ${version} (${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()})`;
  const finalContents = `${line}\n\n${contents}`;
  try {
    fs.writeFileSync(changelogPath, finalContents, 'utf8');
  } catch (err) {
    throw new Error(`Could not update changelog (${changelogPath})`);
  }
};

export {
  addVersionLine,
};
