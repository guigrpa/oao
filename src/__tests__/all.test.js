/* eslint-env jest */
/* eslint-disable global-require */

import all from '../all';

jest.mock('../utils/helpers');

describe('ALL command', () => {
  it('executes the specified command on all sub-packages', async () => {
    const helpers = require('../utils/helpers');
    await all('ls', { src: 'test/fixtures/packages/*' });
    expect(helpers.exec.mock.calls.length).toBe(2);
  });
});
