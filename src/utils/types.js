// @flow

export type OaoSpecs = {
  pkgPath: string,
  specPath: string, // including .package.json
  name: string,
  displayName: string,
  specs: Object,
};
export type AllSpecs = { [key: string]: OaoSpecs };
