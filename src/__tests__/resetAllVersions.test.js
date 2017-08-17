/* eslint-env jest */
/* eslint-disable global-require, import/no-dynamic-require */

import path from 'path';
import { set as timmSet } from 'timm';
import resetAllVersions from '../resetAllVersions';
import { ROOT_PACKAGE } from '../utils/readSpecs';

jest.mock('../utils/shell');
jest.mock('../utils/writeSpecs');

const PACKAGE_NAMES = ['oao', 'oao-b', 'oao-c', 'oao-d', 'oao-priv'];

describe('RESET_ALL_VERSIONS command', () => {
  it('does not modify any package.json (except for the version number)', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const base = path.join(process.cwd(), 'test/fixtures/packages');
    const newVersion = '27.4.2013';

    // Copy original specs
    const originalSpecs = {};
    PACKAGE_NAMES.forEach(name => {
      originalSpecs[name] = require(path.join(base, `${name}/package.json`));
    });
    originalSpecs[ROOT_PACKAGE] = require(path.join(
      process.cwd(),
      'package.json'
    ));

    // Run command
    await resetAllVersions(newVersion, {
      src: 'test/fixtures/packages/*',
      confirm: false,
    });

    // Checks
    expect(writeSpecs.mock.calls).toHaveLength(PACKAGE_NAMES.length + 1);
    writeSpecs.mock.calls.forEach(([specPath, specs]) => {
      const name =
        specPath === path.join(process.cwd(), 'package.json')
          ? ROOT_PACKAGE
          : specs.name;
      expect(specs).toEqual(
        timmSet(originalSpecs[name], 'version', newVersion)
      );
    });
  });

  it('throws when the version is invalid', async () => {
    try {
      await resetAllVersions('xxx', {
        src: 'test/fixtures/packages/*',
        confirm: false,
      });
      throw new Error('DID_NOT_THROW');
    } catch (err) {
      if (err.message === 'DID_NOT_THROW') throw err;
    }
  });
});
