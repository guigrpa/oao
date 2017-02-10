import globby from 'globby';

const listPaths = (srcPatterns) => globby(srcPatterns);

export default listPaths;
