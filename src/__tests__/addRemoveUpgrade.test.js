/* eslint-env jest */
/* eslint-disable global-require, import/no-dynamic-require */

import addRemoveUpgrade from '../addRemoveUpgrade';

jest.mock('../utils/shell');
jest.mock('../utils/writeSpecs');

describe('ADD/REMOVE/UPGRADE commands', () => {
  it('touches only the correct package.json', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    await addRemoveUpgrade('oao-b', 'add', ['mady'], {
      src: 'test/fixtures/packages2/*',
    });
    expect(writeSpecs.mock.calls).toHaveLength(2);
    expect(writeSpecs.mock.calls[0][1]).toMatchSnapshot(); // removes internal deps
    expect(writeSpecs.mock.calls[1][1]).toMatchSnapshot(); // restores internal deps
  });

  it('touches only the correct package.json, with custom links', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    await addRemoveUpgrade('oao-b', 'add', ['mady'], {
      src: 'test/fixtures/packagesCustomLinks/*',
      link: 'ext-.*',
    });
    expect(writeSpecs.mock.calls).toHaveLength(2);
    expect(writeSpecs.mock.calls[0][1]).toMatchSnapshot(); // removes internal deps
    expect(writeSpecs.mock.calls[1][1]).toMatchSnapshot(); // restores internal deps
  });

  it('executes ADD correctly (one package, no flags)', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'add', ['mady'], {
      src: 'test/fixtures/packages2/*',
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes ADD correctly (multiple packages, no flags)', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'add', ['mady', 'jest-html'], {
      src: 'test/fixtures/packages2/*',
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes ADD correctly (flags)', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'add', ['mady', 'jest-html'], {
      src: 'test/fixtures/packages2/*',
      dev: true,
      exact: true,
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes ADD correctly (external/internal deps, flags)', async () => {
    const helpers = require('../utils/shell');
    const writeSpecs = require('../utils/writeSpecs').default;
    await addRemoveUpgrade('oao-c', 'add', ['mady', 'jest-html', 'oao-b'], {
      src: 'test/fixtures/packages2/*',
      dev: true,
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
    expect(writeSpecs).toHaveBeenCalled();
    const finalSpecs =
      writeSpecs.mock.calls[writeSpecs.mock.calls.length - 1][1];
    expect(finalSpecs).toMatchSnapshot();
  });

  it('executes ADD correctly (internal deps, flags)', async () => {
    const helpers = require('../utils/shell');
    const writeSpecs = require('../utils/writeSpecs').default;
    await addRemoveUpgrade('oao-c', 'add', ['oao-b'], {
      src: 'test/fixtures/packages2/*',
      dev: true,
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
    const finalSpecs =
      writeSpecs.mock.calls[writeSpecs.mock.calls.length - 1][1];
    expect(finalSpecs).toMatchSnapshot();
  });

  it('executes ADD correctly (internal scoped dep)', async () => {
    const helpers = require('../utils/shell');
    const writeSpecs = require('../utils/writeSpecs').default;
    await addRemoveUpgrade(
      '@guigrpa/example-package',
      'add',
      ['@guigrpa/example-package-b'],
      {
        src: 'test/fixtures/packagesScoped/*',
      }
    );
    expect(helpers.exec.mock.calls).toMatchSnapshot();
    const finalSpecs =
      writeSpecs.mock.calls[writeSpecs.mock.calls.length - 1][1];
    expect(finalSpecs).toMatchSnapshot();
  });

  it('executes REMOVE correctly', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'remove', ['mady'], {
      src: 'test/fixtures/packages2/*',
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes REMOVE correctly (external/internal deps)', async () => {
    const helpers = require('../utils/shell');
    const writeSpecs = require('../utils/writeSpecs').default;
    await addRemoveUpgrade('oao-c', 'remove', ['timm', 'oao'], {
      src: 'test/fixtures/packages2/*',
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
    expect(writeSpecs).toHaveBeenCalled();
    const finalSpecs =
      writeSpecs.mock.calls[writeSpecs.mock.calls.length - 1][1];
    expect(finalSpecs.dependencies.oao).toBeUndefined();
  });

  it('executes REMOVE correctly (internal deps)', async () => {
    const helpers = require('../utils/shell');
    const writeSpecs = require('../utils/writeSpecs').default;
    await addRemoveUpgrade('oao-c', 'remove', ['oao'], {
      src: 'test/fixtures/packages2/*',
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
    expect(writeSpecs).toHaveBeenCalled();
    const finalSpecs =
      writeSpecs.mock.calls[writeSpecs.mock.calls.length - 1][1];
    expect(finalSpecs.dependencies.oao).toBeUndefined();
  });

  it('executes REMOVE correctly (internal scoped dep)', async () => {
    const helpers = require('../utils/shell');
    const writeSpecs = require('../utils/writeSpecs').default;
    await addRemoveUpgrade(
      '@guigrpa/example-package-b',
      'remove',
      ['@guigrpa/example-package'],
      {
        src: 'test/fixtures/packagesScoped/*',
      }
    );
    expect(helpers.exec.mock.calls).toMatchSnapshot();
    const finalSpecs =
      writeSpecs.mock.calls[writeSpecs.mock.calls.length - 1][1];
    expect(finalSpecs).toMatchSnapshot();
  });

  it('executes UPGRADE correctly (one package, no flags)', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'upgrade', ['mady'], {
      src: 'test/fixtures/packages2/*',
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes UPGRADE correctly (one package, flags)', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'upgrade', ['mady'], {
      src: 'test/fixtures/packages2/*',
      ignoreEngines: true,
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes UPGRADE correctly (external/internal deps, no flags)', async () => {
    const helpers = require('../utils/shell');
    const writeSpecs = require('../utils/writeSpecs').default;
    await addRemoveUpgrade('oao-c', 'upgrade', ['timm', 'oao@2.0.0'], {
      src: 'test/fixtures/packages2/*',
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
    const finalSpecs =
      writeSpecs.mock.calls[writeSpecs.mock.calls.length - 1][1];
    expect(finalSpecs).toMatchSnapshot();
  });

  it('executes UPGRADE correctly (no package, no flags)', async () => {
    const helpers = require('../utils/shell');
    const writeSpecs = require('../utils/writeSpecs').default;
    await addRemoveUpgrade('oao-c', 'upgrade', [], {
      src: 'test/fixtures/packages2/*',
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
    const finalSpecs =
      writeSpecs.mock.calls[writeSpecs.mock.calls.length - 1][1];
    expect(finalSpecs).toMatchSnapshot();
  });

  it('executes UPGRADE correctly (internal scoped dep)', async () => {
    const helpers = require('../utils/shell');
    const writeSpecs = require('../utils/writeSpecs').default;
    await addRemoveUpgrade(
      '@guigrpa/example-package-b',
      'upgrade',
      ['@guigrpa/example-package@2'],
      {
        src: 'test/fixtures/packagesScoped/*',
      }
    );
    expect(helpers.exec.mock.calls).toMatchSnapshot();
    const finalSpecs =
      writeSpecs.mock.calls[writeSpecs.mock.calls.length - 1][1];
    expect(finalSpecs).toMatchSnapshot();
  });

  it('executes ADD correctly with workspaces (one package, flags)', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'add', ['mady'], {
      src: ['test/fixtures/packages2/*'],
      workspaces: true,
      dev: true,
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes UPGRADE correctly with workspaces (one package, no flags)', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'upgrade', ['mady'], {
      src: ['test/fixtures/packages2/*'],
      workspaces: true,
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });

  it('executes REMOVE correctly with workspaces (one package, no flags)', async () => {
    const helpers = require('../utils/shell');
    await addRemoveUpgrade('oao-b', 'remove', ['mady'], {
      src: ['test/fixtures/packages2/*'],
      workspaces: true,
    });
    expect(helpers.exec.mock.calls).toMatchSnapshot();
  });
});
