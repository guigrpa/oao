const runInSeries = async (items, cb) => {
  const out = [];
  for (let i = 0; i < items.length; i++) {
    out[i] = await cb(items[i]);
  }
  return out;
};

const runInParallel = async (items, cb, { waitForAllToResolve } = {}) => {
  const promises = items.map(cb);
  try {
    await Promise.all(promises);
  } catch (err) {
    if (waitForAllToResolve) {
      for (let i = 0; i < promises.length; i++) {
        try {
          await promises[i];
        } catch (err2) {
          /* ignore */
        }
      }
    }
    throw err;
  }
};

export { runInSeries, runInParallel };
