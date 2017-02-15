/* eslint-env jest */
/* eslint-disable global-require, import/no-dynamic-require */

import path from 'path';
import bootstrap from '../bootstrap';

jest.mock('../utils/shell');
jest.mock('../utils/writeSpecs');

const PACKAGE_NAMES = ['oao', 'oao-b', 'oao-c', 'oao-d', 'oao-priv'];

describe('BOOTSTRAP command', () => {
  beforeEach(() => { jest.resetAllMocks(); });

  it('does not modify any package.json', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const base = path.join(process.cwd(), 'test/fixtures/packages');

    // Copy original specs
    const originalSpecs = {};
    PACKAGE_NAMES.forEach((name) => {
      originalSpecs[name] = require(path.join(base, `${name}/package.json`));
    });

    // Run command
    await bootstrap({ src: 'test/fixtures/packages/*' });

    // Process call arguments; we keep the last time a spec is stored
    // and compare it with the original one
    const finalSpecs = {};
    writeSpecs.mock.calls.forEach(([specPath, specs]) => {
      const { name } = specs;
      finalSpecs[name] = specs;
      expect(specPath.split(path.sep)).toContain(name);
      expect(specPath.split(path.sep)).toContain('package.json');
    });
    expect(Object.keys(finalSpecs)).toHaveLength(PACKAGE_NAMES.length);
    PACKAGE_NAMES.forEach((name) => {
      expect(finalSpecs[name]).toEqual(originalSpecs[name]);
    });
  });

  it('executes the correct `yarn link`s and `yarn install`s', async () => {
    const helpers = require('../utils/shell');
    await bootstrap({ src: 'test/fixtures/packages/*' });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });
});
