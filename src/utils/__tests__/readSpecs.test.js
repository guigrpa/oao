/* eslint-env jest */
/* eslint-disable global-require */

import { readAllSpecs, ROOT_PACKAGE } from '../readSpecs';

describe('readAllSpecs', () => {
  it('reads all package.json files as well as metadata', async () => {
    const allSpecs = await readAllSpecs('test/fixtures/packages/*');
    const rootSpecs = allSpecs[ROOT_PACKAGE];
    expect(rootSpecs.pkgPath).toBe('.');
    expect(rootSpecs.displayName).toBe('MONOREPO ROOT');
    expect(rootSpecs.specs.name).toBe('oao');
    delete allSpecs[ROOT_PACKAGE];
    Object.keys(allSpecs).forEach((name) => {
      expect(allSpecs[name].specPath).not.toBeNull();
      delete allSpecs[name].specPath;
    });
    expect(allSpecs).toMatchSnapshot();
  });

  it('accepts --src ending with slash', async () => {
    const allSpecs = await readAllSpecs('test/fixtures/packages/*/');
    delete allSpecs[ROOT_PACKAGE];
    Object.keys(allSpecs).forEach((name) => {
      delete allSpecs[name].specPath;
    });
    expect(allSpecs).toMatchSnapshot();
  });

  it('supports scoped packages', async () => {
    const allSpecs = await readAllSpecs('test/fixtures/packagesScoped/*');
    expect(allSpecs['@guigrpa/example-package'].specs.name).toEqual('@guigrpa/example-package');
    expect(allSpecs['@guigrpa/example-package-b'].specs.name).toEqual('@guigrpa/example-package-b');
  });

  it('throws on invalid directory names (for non-scoped packages)', async () => {
    try {
      await readAllSpecs('test/fixtures/packagesWrongName/*');
      throw new Error('DID_NOT_THROW');
    } catch (err) {
      if (err.message !== 'INVALID_DIR_NAME') throw err;
    }
  });
});
