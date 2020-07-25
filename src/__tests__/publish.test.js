/* eslint-env jest */
/* eslint-disable global-require, import/no-dynamic-require */

import { merge } from 'timm';
import publish from '../publish';

jest.mock('../utils/shell');
jest.mock('../utils/writeSpecs');
jest.mock('../utils/git');

const NOMINAL_OPTIONS = {
  src: 'test/fixtures/packages/*',
  master: true,
  checkUncommitted: true,
  checkUnpulled: true,
  confirm: false,
  bump: true,
  bumpDependentReqs: 'no',
  checks: true,
  gitCommit: true,
  npmPublish: true,
  newVersion: '99.99.99',
  changelog: false,
  changelogPath: 'test/fixtures/CHANGELOG.md',
  _date: new Date('2017-01-01T05:00:00Z'),
  _masterVersion: '0.8.2',
};
const NUM_FIXTURE_SUBPACKAGES = 5;
const NUM_FIXTURE_PRIVATE_SUBPACKAGES = 1;

describe('PUBLISH command', () => {
  let git;
  beforeEach(() => {
    git = require('../utils/git');
    git._initStubs();
  });

  it('allows all kind of errors if --no-checks is enabled', async () => {
    git._setBranch('non-master');
    git._setUncommitted('SOMETHING_HAS_NOT_YET_BEEN_COMMITTED');
    git._setUnpulled('SOMETHING_HAS_NOT_YET_BEEN_PULLED');
    await publish(merge(NOMINAL_OPTIONS, { checks: false }));
    expect(git.gitPushWithTags).toHaveBeenCalled();
  });

  it('throws when current branch is not master', async () => {
    git._setBranch('non-master');
    try {
      await publish(NOMINAL_OPTIONS);
      throw new Error('DID_NOT_THROW');
    } catch (err) {
      if (err.message !== 'BRANCH_CHECK_FAILED') throw err;
    }
  });

  it('allows publishing from main', async () => {
    git._setBranch('main');
    await publish(merge(NOMINAL_OPTIONS));
  });

  it('allows overriding the non-master check', async () => {
    git._setBranch('non-master');
    await publish(merge(NOMINAL_OPTIONS, { master: false }));
  });

  it('throws with invalid increment by value', async () => {
    try {
      await publish(
        merge(NOMINAL_OPTIONS, { incrementVersionBy: 'argle-bargle' })
      );
      throw new Error('DID_NOT_THROW');
    } catch (err) {
      if (err.message !== 'INVALID_INCREMENT_BY_VALUE') throw err;
    }
  });

  it('throws with uncommitted changes', async () => {
    git._setUncommitted('SOMETHING_HAS_NOT_YET_BEEN_COMMITTED');
    try {
      await publish(NOMINAL_OPTIONS);
      throw new Error('DID_NOT_THROW');
    } catch (err) {
      if (err.message !== 'UNCOMMITTED_CHECK_FAILED') throw err;
    }
  });

  it('throws with unpulled changes', async () => {
    git._setUnpulled('SOMETHING_HAS_NOT_YET_BEEN_PULLED');
    try {
      await publish(NOMINAL_OPTIONS);
      throw new Error('DID_NOT_THROW');
    } catch (err) {
      if (err.message !== 'UNPULLED_CHECK_FAILED') throw err;
    }
  });

  it('performs a commit-tag-push on all sub-packages increasing the version number', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    await publish(NOMINAL_OPTIONS);
    expect(writeSpecs).toHaveBeenCalledTimes(1 + NUM_FIXTURE_SUBPACKAGES);
    writeSpecs.mock.calls.forEach(([, specs]) => {
      expect(specs.version).toEqual('99.99.99');
    });
    expect(git.gitCommitChanges).toHaveBeenCalledTimes(1);
    expect(git.gitAddTag).toHaveBeenCalledTimes(1);
    expect(git.gitPushWithTags).toHaveBeenCalledTimes(1);
  });

  it('increments version by major when incrementVersionBy is "major" and newVersion is not set', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const options = Object.assign({}, NOMINAL_OPTIONS, {
      newVersion: undefined,
      incrementVersionBy: 'major',
    });
    await publish(options);
    expect(writeSpecs).toHaveBeenCalledTimes(1 + NUM_FIXTURE_SUBPACKAGES);
    writeSpecs.mock.calls.forEach(([, specs]) => {
      expect(specs.version).toEqual('1.0.0');
    });
  });

  it('increments version by minor when incrementVersionBy is "minor" and newVersion is not set', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const options = Object.assign({}, NOMINAL_OPTIONS, {
      newVersion: undefined,
      incrementVersionBy: 'minor',
    });
    await publish(options);
    expect(writeSpecs).toHaveBeenCalledTimes(1 + NUM_FIXTURE_SUBPACKAGES);
    writeSpecs.mock.calls.forEach(([, specs]) => {
      expect(specs.version).toEqual('0.9.0');
    });
  });

  it('increments version by patch when incrementVersionBy is "patch" and newVersion is not set', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const options = Object.assign({}, NOMINAL_OPTIONS, {
      newVersion: undefined,
      incrementVersionBy: 'patch',
    });
    await publish(options);
    expect(writeSpecs).toHaveBeenCalledTimes(1 + NUM_FIXTURE_SUBPACKAGES);
    writeSpecs.mock.calls.forEach(([, specs]) => {
      expect(specs.version).toEqual('0.8.3');
    });
  });

  it('increments version by prerelease when incrementVersionBy is "rc" and newVersion is not set', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const options = Object.assign({}, NOMINAL_OPTIONS, {
      newVersion: undefined,
      incrementVersionBy: 'rc',
    });
    await publish(options);
    expect(writeSpecs).toHaveBeenCalledTimes(1 + NUM_FIXTURE_SUBPACKAGES);
    writeSpecs.mock.calls.forEach(([, specs]) => {
      expect(specs.version).toEqual('1.0.0-rc.0');
    });
  });

  it('increments version by prerelease when incrementVersionBy is "beta" and newVersion is not set', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const options = Object.assign({}, NOMINAL_OPTIONS, {
      newVersion: undefined,
      incrementVersionBy: 'beta',
    });
    await publish(options);
    expect(writeSpecs).toHaveBeenCalledTimes(1 + NUM_FIXTURE_SUBPACKAGES);
    writeSpecs.mock.calls.forEach(([, specs]) => {
      expect(specs.version).toEqual('1.0.0-beta.0');
    });
  });

  it('increments version by prerelease when incrementVersionBy is "alpha" and newVersion is not set', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const options = Object.assign({}, NOMINAL_OPTIONS, {
      newVersion: undefined,
      incrementVersionBy: 'alpha',
    });
    await publish(options);
    expect(writeSpecs).toHaveBeenCalledTimes(1 + NUM_FIXTURE_SUBPACKAGES);
    writeSpecs.mock.calls.forEach(([, specs]) => {
      expect(specs.version).toEqual('1.0.0-alpha.0');
    });
  });

  it('runs `npm publish` on all non-private sub-packages', async () => {
    const { exec } = require('../utils/shell');
    await publish(NOMINAL_OPTIONS);
    expect(exec).toHaveBeenCalledTimes(
      NUM_FIXTURE_SUBPACKAGES - NUM_FIXTURE_PRIVATE_SUBPACKAGES
    );
    exec.mock.calls.forEach(([cmd]) => {
      expect(cmd).toEqual('npm publish');
    });
  });

  it('runs `npm publish` following the dependency graph by default', async () => {
    const { exec } = require('../utils/shell');
    await publish(
      Object.assign({}, NOMINAL_OPTIONS, {
        src: 'test/fixtures/packages3/*',
      })
    );
    expect(exec).toHaveBeenCalledTimes(
      NUM_FIXTURE_SUBPACKAGES - NUM_FIXTURE_PRIVATE_SUBPACKAGES
    );
    const paths = exec.mock.calls.map(([, { cwd }]) => cwd);
    expect(paths).toEqual([
      'test/fixtures/packages3/oao-b',
      'test/fixtures/packages3/oao',
      'test/fixtures/packages3/oao-c',
      'test/fixtures/packages3/oao-d',
    ]);
  });

  it('runs `npm publish --tag X` on all sub-packages', async () => {
    const { exec } = require('../utils/shell');
    await publish(merge(NOMINAL_OPTIONS, { publishTag: 'next' }));
    expect(exec).toHaveBeenCalledTimes(
      NUM_FIXTURE_SUBPACKAGES - NUM_FIXTURE_PRIVATE_SUBPACKAGES
    );
    exec.mock.calls.forEach(([cmd]) => {
      expect(cmd).toEqual('npm publish --tag next');
    });
  });

  it('runs `npm publish --otp X` on all sub-packages', async () => {
    const { exec } = require('../utils/shell');
    await publish(merge(NOMINAL_OPTIONS, { otp: '123456' }));
    expect(exec).toHaveBeenCalledTimes(
      NUM_FIXTURE_SUBPACKAGES - NUM_FIXTURE_PRIVATE_SUBPACKAGES
    );
    exec.mock.calls.forEach(([cmd]) => {
      expect(cmd).toEqual('npm publish --otp 123456');
    });
  });

  it('runs `npm publish --access X` on all sub-packages', async () => {
    const { exec } = require('../utils/shell');
    await publish(merge(NOMINAL_OPTIONS, { access: 'public' }));
    expect(exec).toHaveBeenCalledTimes(
      NUM_FIXTURE_SUBPACKAGES - NUM_FIXTURE_PRIVATE_SUBPACKAGES
    );
    exec.mock.calls.forEach(([cmd]) => {
      expect(cmd).toEqual('npm publish --access public');
    });
  });

  it('does not run `npm publish --access X` with bogus access param', async () => {
    const { exec } = require('../utils/shell');
    await publish(merge(NOMINAL_OPTIONS, { access: 'bogus' }));
    expect(exec).toHaveBeenCalledTimes(
      NUM_FIXTURE_SUBPACKAGES - NUM_FIXTURE_PRIVATE_SUBPACKAGES
    );
    exec.mock.calls.forEach(([cmd]) => {
      expect(cmd).toEqual('npm publish');
    });
  });

  it('skips `npm publish` when using --no-npm-publish', async () => {
    const { exec } = require('../utils/shell');
    await publish(merge(NOMINAL_OPTIONS, { npmPublish: false }));
    expect(exec).not.toHaveBeenCalled();
  });

  it('updates the changelog correctly', async () => {
    const fs = require('fs');
    const { writeFileSync } = fs;
    let calls;
    try {
      fs.writeFileSync = jest.fn();
      await publish(merge(NOMINAL_OPTIONS, { changelog: true }));
      ({ calls } = fs.writeFileSync.mock);
    } finally {
      fs.writeFileSync = writeFileSync;
    }
    expect(calls).toMatchSnapshot();
  });

  it('publishes non-monorepo packages', async () => {
    const { exec } = require('../utils/shell');
    await publish(merge(NOMINAL_OPTIONS, { src: [], single: true }));
    expect(exec).toHaveBeenCalledTimes(1);
    exec.mock.calls.forEach(([cmd]) => {
      expect(cmd).toEqual('npm publish');
    });
  });

  it('does not bump versions when using --no-bump', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const { exec } = require('../utils/shell');
    await publish(merge(NOMINAL_OPTIONS, { bump: false }));
    expect(writeSpecs).not.toHaveBeenCalled();
    expect(git.gitPushWithTags).not.toHaveBeenCalled();
    exec.mock.calls.forEach(([cmd]) => {
      expect(cmd).toEqual('npm publish');
    });
  });

  it('bumps cross-deps using ranges by default', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const { exec } = require('../utils/shell');
    await publish(
      merge(NOMINAL_OPTIONS, {
        src: 'test/fixtures/packages2/*',
        bumpDependentReqs: null,
      })
    );
    expect(writeSpecs).toHaveBeenCalledTimes(6);
    writeSpecs.mock.calls.slice(0, 4).forEach(([, specs]) => {
      expect(specs.version).toEqual('99.99.99');
    });
    expect(writeSpecs.mock.calls[4][1].dependencies.oao).toEqual('^99.99.99');
    expect(writeSpecs.mock.calls[5][1].dependencies.oao).toEqual('^99.99.99');
  });

  it('bumps cross-deps using exact versions with a flag', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const { exec } = require('../utils/shell');
    await publish(
      merge(NOMINAL_OPTIONS, {
        src: 'test/fixtures/packages2/*',
        bumpDependentReqs: 'exact',
      })
    );
    expect(writeSpecs).toHaveBeenCalledTimes(6);
    writeSpecs.mock.calls.slice(0, 4).forEach(([, specs]) => {
      expect(specs.version).toEqual('99.99.99');
    });
    expect(writeSpecs.mock.calls[4][1].dependencies.oao).toEqual('99.99.99');
    expect(writeSpecs.mock.calls[5][1].dependencies.oao).toEqual('99.99.99');
  });
});
