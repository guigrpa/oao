import fs from 'fs';

const writeSpecs = (specPath, specs) => {
  fs.writeFileSync(specPath, `${JSON.stringify(specs, null, '  ')}\n`, 'utf8');
};

export default writeSpecs;
