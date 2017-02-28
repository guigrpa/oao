/* eslint-env jest */

module.exports = jest.fn((p, options, cb) => {
  if (typeof options === 'function') {
    options();
  } else {
    cb();
  }
});
