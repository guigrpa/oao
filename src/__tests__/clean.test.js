/* eslint-env jest */
/* eslint-disable global-require, import/no-dynamic-require */

import clean from '../clean';

jest.mock('rimraf');

describe('CLEAN command', () => {
  it('executes the correct rimraf calls', async () => {
    const rimraf = require('rimraf');
    await clean({ src: 'test/fixtures/packages/*' });
    const paths = rimraf.mock.calls.map(call => call[0].replace(/\\/g, '/'));
    expect(paths).toMatchSnapshot();
  });
});
