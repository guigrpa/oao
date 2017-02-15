/* eslint-env jest */
/* eslint-disable global-require */

import { readAllSpecs, ROOT_PACKAGE } from '../readSpecs';

describe('readAllSpecs', () => {
  it('reads all package.json files as well as metadata', async () => {
    const allSpecs = await readAllSpecs('test/fixtures/packages/*');
    const rootSpecs = allSpecs[ROOT_PACKAGE];
    expect(rootSpecs.pkgPath).toBe('.');
    expect(rootSpecs.specs.name).toBe('oao');
    delete allSpecs[ROOT_PACKAGE];
    Object.keys(allSpecs).forEach((name) => {
      expect(allSpecs[name].specPath).not.toBeNull();
      delete allSpecs[name].specPath;
    });
    expect(allSpecs).toMatchSnapshot();
  });
});
