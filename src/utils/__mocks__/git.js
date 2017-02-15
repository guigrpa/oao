/* eslint-env jest */

const git = jest.genMockFromModule('../git');

let branch;

git._setBranch = (branch0) => { branch = branch0; };
git.gitCurBranch = jest.fn(() => Promise.resolve(branch));

module.exports = git;
