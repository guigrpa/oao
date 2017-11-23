/* eslint-env jest */

import calcGraph from '../calcGraph';

const ALL_SPECS_NO_CYCLE = {
  a: {
    name: 'a',
    specs: {
      dependencies: { b: '*', c: '*' },
    },
  },
  b: {
    name: 'b',
    specs: {
      dependencies: { ext: '*' },
    },
  },
  c: {
    name: 'c',
    specs: {
      dependencies: { ext: '*' },
      devDependencies: { d: '*' },
    },
  },
  d: {
    name: 'd',
    specs: {},
  },
};

const ALL_SPECS_CYCLE = {
  a: {
    name: 'a',
    specs: {
      dependencies: { b: '*', c: '*' },
    },
  },
  b: {
    name: 'b',
    specs: {
      dependencies: { ext: '*' },
    },
  },
  c: {
    name: 'c',
    specs: {
      dependencies: { ext: '*' },
      devDependencies: { d: '*', e: '*' },
    },
  },
  d: {
    name: 'd',
    specs: {},
  },
  e: {
    name: 'e',
    specs: {
      optionalDependencies: { a: '*' },
    },
  },
};

describe('buildGraph', () => {
  it('calculates a directed acyclic graph correctly when no cycles are present', () => {
    const dag = calcGraph(ALL_SPECS_NO_CYCLE);
    expect(dag).toMatchSnapshot();
  });

  it('handles cycles correctly', () => {
    const dag = calcGraph(ALL_SPECS_CYCLE);
    expect(dag).toMatchSnapshot();
  });
});
