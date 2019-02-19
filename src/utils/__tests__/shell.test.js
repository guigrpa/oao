/* eslint-env jest */

import path from 'path';
import { exec } from '../shell';

describe('shell helpers', () => {
  it('exec (simple case)', async () => {
    const { stdout } = await exec('echo HELLO');
    expect(stdout.trim()).toEqual('HELLO');
  });

  it('exec (with cwd)', async () => {
    const cmd = process.platform === 'win32' ? 'cd' : 'pwd';
    const { stdout } = await exec(cmd, { cwd: 'test' });
    expect(
      stdout
        .trim()
        .split(path.sep)
        .slice(-2)
    ).toEqual(['oao', 'test']);
  });
});
