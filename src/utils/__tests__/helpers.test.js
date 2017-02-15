/* eslint-env jest */

import { exec } from '../shell';

describe('shell helpers', () => {
  it('exec (simple case)', async () => {
    const { stdout } = await exec('echo HELLO');
    expect(stdout.trim()).toEqual('HELLO');
  });

  const itt = process.platform === 'win32' ? it.skip : it;
  itt('exec (with cwd)', async () => {
    const { stdout } = await exec('pwd', { cwd: 'test' });
    expect(stdout.trim()).toMatch(/\/oao\/test$/);
  });
});
