/* eslint-env jest */
/* eslint-disable global-require, import/no-dynamic-require */

import path from 'path';
import bootstrap from '../bootstrap';

jest.mock('../utils/shell');
jest.mock('../utils/writeSpecs');

const PACKAGE_NAMES_1 = ['oao', 'oao-b', 'oao-c', 'oao-d', 'oao-priv'];
const PACKAGE_NAMES_2 = ['oao', 'oao-b', 'oao-c'];

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

describe('BOOTSTRAP command', () => {
  beforeEach(() => { jest.resetAllMocks(); });

  it('does not modify any package.json', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const base = path.join(process.cwd(), 'test/fixtures/packages');
    const originalSpecs = readOriginalSpecs(base, PACKAGE_NAMES_1);
    await bootstrap({ src: 'test/fixtures/packages/*' });
    // Process call arguments; we keep the last time a spec is stored
    // and compare it with the original one
    writeSpecs.mock.calls.forEach(([specPath, specs]) => {
      const { name } = specs;
      expect(specPath.split(path.sep)).toContain(name);
      expect(specPath.split(path.sep)).toContain('package.json');
    });
    PACKAGE_NAMES_1.forEach((name) => {
      expect(spyFinalSpec(writeSpecs, name)).toEqual(originalSpecs[name]);
    });
  });

  it('does not modify any package.json with custom links', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const base = path.join(process.cwd(), 'test/fixtures/packagesCustomLinks');
    const originalSpecs = readOriginalSpecs(base, PACKAGE_NAMES_2);
    await bootstrap({
      src: 'test/fixtures/packagesCustomLinks/*',
      link: 'ext-.*',
    });
    PACKAGE_NAMES_2.forEach((name) => {
      expect(spyFinalSpec(writeSpecs, name)).toEqual(originalSpecs[name]);
    });
  });

  it('executes the correct `yarn link`s and `yarn install`s', async () => {
    const helpers = require('../utils/shell');
    await bootstrap({ src: 'test/fixtures/packages/*' });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes the correct `yarn link`s and `yarn install`s in production', async () => {
    const helpers = require('../utils/shell');
    await bootstrap({ src: 'test/fixtures/packages/*', production: true });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes the correct `yarn link`s and `yarn install`s with custom links', async () => {
    const helpers = require('../utils/shell');
    await bootstrap({
      src: 'test/fixtures/packagesCustomLinks/*',
      link: 'ext-.*',
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('supports scoped packages', async () => {
    const helpers = require('../utils/shell');
    await bootstrap({ src: 'test/fixtures/packagesScoped/*' });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });
});
