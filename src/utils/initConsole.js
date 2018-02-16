// @flow

import { addListener } from 'storyboard';
import consoleListener from 'storyboard-listener-console';

const initConsole = (options = {}) => {
  const { relativeTime } = options;
  addListener(consoleListener, { relativeTime });
};

export default initConsole;
