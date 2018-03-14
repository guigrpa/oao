// @flow

import { DEP_TYPES } from './constants';
import type { OaoSpecs } from './types';

const shortenName = (name: string, maxLen: number): string => {
  if (name.length <= maxLen) return name;
  return `${name.slice(0, 2)}…${name.slice(-(maxLen - 3))}`;
};

const isObject = (o: any) => !!o && o.constructor === Object;

const delay = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const dependsOn = (pkg: OaoSpecs, possibleDep: string) => {
  const { specs } = pkg;
  for (let i = 0; i < DEP_TYPES.length; i++) {
    const depType = DEP_TYPES[i];
    const deps = specs[depType] || {};
    if (deps[possibleDep]) return true;
  }
  return false;
};

export { shortenName, isObject, delay, dependsOn };
