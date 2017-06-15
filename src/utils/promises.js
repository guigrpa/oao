const runInSeries = async (items, cb) => {
  const out = [];
  for (let i = 0; i < items.length; i++) {
    out[i] = await cb(items[i]);
  }
  return out;
};

const runInParallel = async (items, cb) =>
  Promise.all(items.map(cb));

export {
  runInSeries, runInParallel,
};
