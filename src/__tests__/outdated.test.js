/* eslint-env jest */
/* eslint-disable global-require, import/no-dynamic-require */

import path from 'path';
import outdated from '../outdated';

jest.mock('../utils/shell');
jest.mock('../utils/writeSpecs');

const PACKAGE_NAMES_1 = ['oao', 'oao-b', 'oao-c', 'oao-d', 'oao-priv'];

const readOriginalSpecs = (base, names) => {
  const originalSpecs = {};
  names.forEach((name) => {
    originalSpecs[name] = require(path.join(base, `${name}/package.json`));
  });
  return originalSpecs;
};

const spyFinalSpec = (spy, pkgName) => {
  let finalSpec;
  spy.mock.calls.forEach(([, specs]) => {
    if (specs.name === pkgName) finalSpec = specs;
  });
  return finalSpec;
};

describe('OUTDATED command', () => {
  beforeEach(() => { jest.resetAllMocks(); });

  it('does not modify any package.json', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const base = path.join(process.cwd(), 'test/fixtures/packages');
    const originalSpecs = readOriginalSpecs(base, PACKAGE_NAMES_1);
    await outdated({ src: 'test/fixtures/packages/*' });
    // Process call arguments; we keep the last time a spec is stored
    // and compare it with the original one
    writeSpecs.mock.calls.forEach(([specPath, specs]) => {
      const { name } = specs;
      expect(specPath.split(path.sep)).toContain(name);
      expect(specPath.split(path.sep)).toContain('package.json');
    });
    PACKAGE_NAMES_1.forEach((name) => {
      const finalSpecWritten = spyFinalSpec(writeSpecs, name);
      if (finalSpecWritten === undefined) return;  // not changed at all!
      expect(finalSpecWritten).toEqual(originalSpecs[name]);
    });
  });

  it('executes the correct `yarn outdated`s', async () => {
    const helpers = require('../utils/shell');
    await outdated({ src: 'test/fixtures/packages/*' });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });
});
