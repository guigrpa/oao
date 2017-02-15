/* eslint-env jest */
/* eslint-disable global-require, import/no-dynamic-require */

import path from 'path';
import prepublish from '../prepublish';

jest.mock('../utils/shell');
jest.mock('../utils/writeSpecs');

const COPY_SPECS = [
  'description', 'keywords',
  'author', 'license',
  'homepage', 'bugs', 'repository',
];

const normalizePath = (p) => p.split(path.sep).join('/');

describe('PREPUBLISH command', () => {
  beforeEach(() => { jest.resetAllMocks(); });

  it('copies READMEs as appropriate', async () => {
    const helpers = require('../utils/shell');
    await prepublish({ src: 'test/fixtures/packages/*' });
    const normalizedArgs = helpers.cp.mock.calls.map(([src, dst]) =>
      [normalizePath(src), normalizePath(dst)]
    );
    expect(normalizedArgs).toMatchSnapshot();
  });

  it('copies common attributes to subpackages', async () => {
    const writeSpecs = require('../utils/writeSpecs').default;
    const refSpecs = require(path.join(process.cwd(), 'package.json'));
    await prepublish({ src: 'test/fixtures/packages/*' });
    expect(writeSpecs.mock.calls.map((args) => args[1].name)).toEqual(['oao', 'oao-b', 'oao-c', 'oao-d']);
    writeSpecs.mock.calls.forEach(([, specs]) => {
      COPY_SPECS.forEach((attr) => { expect(specs[attr]).toEqual(refSpecs[attr]); });
    });
  });

  it('throws when a package has a version > master', async () => {
    try {
      await prepublish({ src: 'test/fixtures/packagesWrongVersion/*' });
      throw new Error('DID_NOT_THROW');
    } catch (err) {
      if (err.message === 'DID_NOT_THROW') throw err;
    }
  });

  it('throws when a package has an invalid version', async () => {
    try {
      await prepublish({ src: 'test/fixtures/packagesWrongVersion2/*' });
      throw new Error('DID_NOT_THROW');
    } catch (err) {
      if (err.message === 'DID_NOT_THROW') throw err;
    }
  });
});
