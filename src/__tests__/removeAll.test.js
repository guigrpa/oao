/* eslint-env jest */
/* eslint-disable global-require, import/no-dynamic-require */

import removeAll from '../removeAll';

jest.mock('../utils/shell');
jest.mock('../utils/writeSpecs');

describe('REMOVE-ALL command', () => {
  it("leaves package.json untouched if it doesn't depend on dep", async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    await removeAll(['mady'], {
      src: 'test/fixtures/packages/*',
    });
    expect(writeSpecs.mock.calls).toHaveLength(0);
  });

  it('modifies package.json if it depends on dep', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    await removeAll(['ext-one'], {
      src: 'test/fixtures/packagesCustomLinks/*',
    });
    expect(writeSpecs.mock.calls).toHaveLength(2);
    expect(writeSpecs.mock.calls[0][1]).toMatchSnapshot();
    expect(writeSpecs.mock.calls[1][1]).toMatchSnapshot();
  });

  it('removes a dep everywhere it may appear', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    await removeAll(['ext-two'], {
      src: 'test/fixtures/packagesCustomLinks/*',
    });
    expect(writeSpecs.mock.calls).toHaveLength(1);
    expect(writeSpecs.mock.calls[0][1]).toMatchSnapshot();
  });

  it('removes multiple deps', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    await removeAll(['ext-one', 'ext-two'], {
      src: 'test/fixtures/packagesCustomLinks/*',
    });
    expect(writeSpecs.mock.calls).toHaveLength(2);
    expect(writeSpecs.mock.calls[0][1]).toMatchSnapshot();
    expect(writeSpecs.mock.calls[1][1]).toMatchSnapshot();
  });
});
