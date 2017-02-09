import fs from 'fs';

const writeSpecs = (specPath, specs) => {
  fs.writeFileSync(specPath, JSON.stringify(specs, null, '  '), 'utf8');
};

export default writeSpecs;
