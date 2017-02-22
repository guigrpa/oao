import { merge, addDefaults, set as timmSet } from 'timm';
import { terminal as term } from 'terminal-kit';

const REQUIRED_CORE_VERSION = '^3.0.0-rc.2';

const DEFAULT_CONFIG = {
  moduleNameLength: 20,
  relativeTime: false,
  colors: true,
};

// -----------------------------------------
// Listener
// -----------------------------------------
class ParallelConsoleListener {
  constructor(config, { hub, recordToLines, chalk }) {
    this.type = 'PARALLEL_CONSOLE';
    this.config = config;
    this.hub = hub;
    this.hubId = hub.getHubId();
    this.recordToLines = recordToLines;
    this.chalk = chalk;
    this.prevTime = 0;
  }

  configure(config) {
    this.config = merge(this.config, config);
  }

  getConfig() {
    return this.config;
  }

  init() {
    this.initThreads();
    this.timerCheckSize = setInterval(this.termCheckResize, 500);
    this.termInit();
    this.termCheckResize();
  }

  tearDown() {
    this.resetCursorPos();
    if (this.timerCheckSize != null) {
      clearInterval(this.timerCheckSize);
      this.timerCheckSize = null;
    }
  }

  // -----------------------------------------
  // Main processing function
  // -----------------------------------------
  process(msg) {
    if (msg.type !== 'RECORDS') return;
    if (msg.hubId !== this.hubId) return; // only log local records
    msg.data.forEach((record) => this.processRecord(record));
  }

  processRecord(record) {
    if (
      record.fStory && record.action === 'CREATED' &&
      (record.fRoot || (record.parents.length && record.parents[0][0] === '*'))
    ) {
      this.createThread(record);
      return;
    }
    const threadId = this.getThread(record);
    if (threadId == null) return;
    if (record.action === 'CLOSED' && record.storyId === threadId) return;
    // console.log(`fStory=${record.fStory}, parents=${record.parents}, action=${record.action}`)
    const options = timmSet(this.config, 'prevTime', this.prevTime);
    const lines = this.recordToLines(record, options);
    this.prevTime = new Date(record.t);
    lines.forEach(({ text, fLongDelay }) => {
      if (fLongDelay) this.addLineToThread(threadId, '          ...');
      this.addLineToThread(threadId, text);
    });
  }

  // -----------------------------------------
  // Terminal
  // -----------------------------------------
  initThreads() {
    this.threads = {};
    this.storyIdToThreadId = {};
  }

  createThread(record) {
    const { storyId, t, title } = record;
    const threadId = storyId;
    this.threads[threadId] = { storyId, t, title, open: true, lines: [] };
    this.storyIdToThreadId[storyId] = threadId;
    this.termRefreshAll();
  }

  getThread(record) {
    const { storyId } = record;

    // Look up the storyId in the cache
    let threadId = this.storyIdToThreadId[storyId];
    if (threadId != null) return threadId;

    // It's not a story, and its story is not in the cache. We have no clue...
    if (!record.fStory) return null;

    // It's a story. Look for its parents; if they're in the cache, add this new
    // story to the same thread
    const { parents } = record;
    for (let i = 0; i < parents.length; i++) {
      const parentId = parents[i];
      threadId = this.storyIdToThreadId[parentId];
      if (threadId != null) {
        this.storyIdToThreadId[storyId] = threadId;
        return threadId;
      }
    }

    // Bad luck
    return null;
  }

  addLineToThread(threadId, line) {
    const thread = this.threads[threadId];
    if (!thread) return;
    thread.lines.push(line);
    // TODO: forget...
    this.termRefreshThread(threadId);
  }

  // -----------------------------------------
  // Terminal
  // -----------------------------------------
  // Clear the terminal, in such a way that we don't overwrite previous history
  termInit() {
    /* eslint-disable no-console */
    for (let i = 0; i < term.height; i++) console.log('');
    /* eslint-enable no-console */
  }

  termCheckResize = () => {
    const { width, height } = term;
    if (width !== this.width || height !== this.height) {
      this.width = width;
      this.height = height;
      this.termRefreshAll();
    }
  }

  termRefreshAll() {
    term.clear();
    const { threads, height: h0 } = this;
    const threadIds = Object.keys(threads);
    let len = threadIds.length;
    if (!len) return;
    let truncated = false;
    let h = h0;
    if (len * 2 > h) {
      truncated = true;
      h -= 1;
      len = Math.floor(h / 2);
    }
    const delta = h / len;
    for (let i = 0; i < len; i++) {
      const threadId = threadIds[i];
      const thread = threads[threadId];
      thread.idx = i + 1;
      thread.y1 = Math.floor(i * delta);
      thread.y2 = Math.floor((i + 1) * delta) - 1;
      thread.shown = true;
      this.termRefreshThread(threadId, i);
    }
    for (let i = len; i < threadIds.length; i++) {
      threads[threadIds[i]].shown = false;
    }
    if (truncated) {
      const numHidden = threadIds.length - len;
      term.moveTo(1, h0, this.chalk.bgRed(`  ${numHidden} hidden thread${numHidden > 1 ? 's' : ''}`));
      // TODO: show warning that more stories are available
    }
    this.resetCursorPos();
  }

  termRefreshThread(threadId) {
    const thread = this.threads[threadId];
    if (!thread || !thread.shown) return;
    const { y1, y2 } = thread;
    const { width: w } = this;

    // Write title
    this.termWriteLine(y1, `${this.chalk.bgWhite.black.bold(` ${thread.idx} `)} ${thread.title}`, w);

    // Write as many lines as fit
    const len = y2 - y1;
    const lines = thread.lines.slice(-len);
    for (let i = 0; i < lines.length; i++) {
      const line = `  ${lines[i]}`;
      this.termWriteLine(y1 + i + 1, line, w);
    }

    this.resetCursorPos();
  }

  termWriteLine(y, text, w) {
    term.moveTo(1, y + 1).eraseLine();
    const uncolored = this.chalk.stripColor(text);
    const finalText = uncolored.length > w ? `${uncolored.slice(0, w - 1)}…` : text;
    term(finalText);
  }

  resetCursorPos() {
    term.moveTo(1, this.height);
  }
}

// -----------------------------------------
// API
// -----------------------------------------
const create = (userConfig, context) =>
  new ParallelConsoleListener(addDefaults(userConfig, DEFAULT_CONFIG), context);
create.requiredCoreVersion = REQUIRED_CORE_VERSION;

export default create;
