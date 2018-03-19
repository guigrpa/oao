/* eslint-env jest */
/* eslint-disable global-require, import/no-dynamic-require */

import bump from '../bump';

jest.mock('../utils/shell');
jest.mock('../utils/writeSpecs');

describe('BUMP command', () => {
  it("leaves package.json untouched if it doesn't depend on dep", async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    await bump(['mady@18'], {
      src: 'test/fixtures/packages/*',
    });
    expect(writeSpecs.mock.calls).toHaveLength(0);
  });

  it('modifies package.json if it depends on dep', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    await bump(['ext-one@18'], {
      src: 'test/fixtures/packagesCustomLinks/*',
    });
    expect(writeSpecs.mock.calls).toHaveLength(2);
    expect(writeSpecs.mock.calls[0][1]).toMatchSnapshot();
    expect(writeSpecs.mock.calls[1][1]).toMatchSnapshot();
  });

  it('modifies a dep version everywhere it may appear', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    await bump(['ext-two@18'], {
      src: 'test/fixtures/packagesCustomLinks/*',
    });
    expect(writeSpecs.mock.calls).toHaveLength(1);
    expect(writeSpecs.mock.calls[0][1]).toMatchSnapshot();
  });

  it('modifies multiple deps', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    await bump(['ext-one@18', 'ext-two@18'], {
      src: 'test/fixtures/packagesCustomLinks/*',
    });
    expect(writeSpecs.mock.calls).toHaveLength(2);
    expect(writeSpecs.mock.calls[0][1]).toMatchSnapshot();
    expect(writeSpecs.mock.calls[1][1]).toMatchSnapshot();
  });

  it('uses current version for internal deps', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    await bump(['oao-c'], {
      src: 'test/fixtures/packages/*',
    });
    expect(writeSpecs.mock.calls).toHaveLength(2);
    expect(writeSpecs.mock.calls[0][1]).toMatchSnapshot();
    expect(writeSpecs.mock.calls[1][1]).toMatchSnapshot();
  });
});
