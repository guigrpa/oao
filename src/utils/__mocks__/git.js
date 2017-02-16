/* eslint-env jest */

const git = jest.genMockFromModule('../git');
const pkg = require('../../../package.json');

git._initStubs = () => {
  let branch = 'master';
  git._setBranch = (branch0) => { branch = branch0; };
  git.gitCurBranch = jest.fn(() => Promise.resolve(branch));

  let uncommitted = '';
  git._setUncommitted = (uncommitted0) => { uncommitted = uncommitted0; };
  git.gitUncommittedChanges = jest.fn(() => Promise.resolve(uncommitted));

  let unpulled = '0';
  git._setUnpulled = (unpulled0) => { unpulled = unpulled0; };
  git.gitUnpulledChanges = jest.fn(() => Promise.resolve(unpulled));

  const lastTag = `v${pkg.version}`;
  git.gitLastTag = jest.fn(() => Promise.resolve(lastTag));

  let diff = 'SOMETHING_HAS_CHANGED';
  git._setSubpackageDiff = (diff0) => { diff = diff0; };
  git.gitDiffSinceIn = jest.fn(() => Promise.resolve(diff));
};

module.exports = git;
