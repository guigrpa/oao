// @flow

import fs from 'fs';

const writeSpecs = (specPath: string, specs: Object) => {
  fs.writeFileSync(specPath, `${JSON.stringify(specs, null, 2)}\n`, 'utf8');
};

export default writeSpecs;
