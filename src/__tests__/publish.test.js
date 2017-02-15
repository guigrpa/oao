/* eslint-env jest */
/* eslint-disable global-require, import/no-dynamic-require */

// import publish from '../publish';

jest.mock('../utils/shell');
jest.mock('../utils/writeSpecs');
jest.mock('../utils/git');

describe('PUBLISH command', () => {
  beforeEach(() => { jest.resetAllMocks(); });

  it('placeholder', async () => {
    // const git = require('../utils/git');
    // console.log(git.gitCurBranch.mock.calls);
  });
});
