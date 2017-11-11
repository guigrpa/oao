/* eslint-env jest */
/* eslint-disable global-require */

import runScript from '../runScript';

jest.mock('../utils/shell');

describe('RUN-SCRIPT command', () => {
  it('executes the specified script on all sub-packages', async () => {
    const helpers = require('../utils/shell');
    await runScript('start', { src: 'test/fixtures/packages/*' });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });
});
