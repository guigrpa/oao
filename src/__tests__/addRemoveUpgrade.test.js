/* eslint-env jest */
/* eslint-disable global-require, import/no-dynamic-require */

import addRemoveUpgrade from '../addRemoveUpgrade';

jest.mock('../utils/shell');
jest.mock('../utils/writeSpecs');

describe('ADD/REMOVE/UPGRADE commands', () => {
  it('touches only the correct package.json', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    await addRemoveUpgrade('oao-b', 'add', ['mady'], { src: 'test/fixtures/packages2/*' });
    expect(writeSpecs.mock.calls).toHaveLength(2);
    expect(writeSpecs.mock.calls[0][1]).toMatchSnapshot();  // removes internal deps
    expect(writeSpecs.mock.calls[1][1]).toMatchSnapshot();  // restores internal deps
  });

  it('touches only the correct package.json, with custom links', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    await addRemoveUpgrade('oao-b', 'add', ['mady'], {
      src: 'test/fixtures/packagesCustomLinks/*',
      link: 'ext-.*',
    });
    expect(writeSpecs.mock.calls).toHaveLength(2);
    expect(writeSpecs.mock.calls[0][1]).toMatchSnapshot();  // removes internal deps
    expect(writeSpecs.mock.calls[1][1]).toMatchSnapshot();  // restores internal deps
  });

  it('executes ADD correctly (one package, no flags)', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'add', ['mady'], { src: 'test/fixtures/packages2/*' });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes ADD correctly (multiple packages, no flags)', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'add', ['mady', 'jest-html'], { src: 'test/fixtures/packages2/*' });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes ADD correctly (flags)', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'add', ['mady', 'jest-html'], {
      src: 'test/fixtures/packages2/*',
      dev: true,
      exact: true,
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes REMOVE correctly', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'remove', ['mady'], { src: 'test/fixtures/packages2/*' });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes UPGRADE correctly (one package, no flags)', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'upgrade', ['mady'], { src: 'test/fixtures/packages2/*' });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes UPGRADE correctly (one package, flags)', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'upgrade', ['mady'], {
      src: 'test/fixtures/packages2/*',
      ignoreEngines: true,
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes UPGRADE correctly (no package, no flags)', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'upgrade', [], { src: 'test/fixtures/packages2/*' });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });
});
