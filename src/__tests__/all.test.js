/* eslint-env jest */
/* eslint-disable global-require */

import all from '../all';

jest.mock('../utils/shell');

describe('ALL command', () => {
  it('executes the specified command on all sub-packages', async () => {
    const helpers = require('../utils/shell');
    await all('ls', { src: 'test/fixtures/packages/*' });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });
});
