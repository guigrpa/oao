// @flow

import { addListener } from 'storyboard';
import consoleListener from 'storyboard-listener-console';

type Options = {
  relativeTime?: boolean,
};

const initConsole = (options?: Options = {}) => {
  const { relativeTime } = options;
  addListener(consoleListener, { relativeTime });
};

export default initConsole;
