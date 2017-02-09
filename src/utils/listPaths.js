import globby from 'globby';

const listPaths = () => globby('packages/*');

export default listPaths;
