#!/usr/bin/env node

/* eslint-disable max-len */

import 'babel-polyfill';
import program from 'commander';
import './utils/initConsole';
import status from './status';
import bootstrap from './bootstrap';
import clean from './clean';
import addRemoveUpgrade from './addRemoveUpgrade';
import outdated from './outdated';
import prepublish from './prepublish';
import publish from './publish';
import resetAllVersions from './resetAllVersions';
import all from './all';

const pkg = require('../package.json');

const DEFAULT_SRC_DIR = 'packages/*';
const DEFAULT_COPY_ATTRS = 'description,keywords,author,license,homepage,bugs,repository';
const DEFAULT_CHANGELOG = 'CHANGELOG.md';

program.version(pkg.version);

const createCommand = (syntax, description) =>
  program.command(syntax).description(description)
  .option('-s --src <glob>', `glob pattern for sub-package paths [${DEFAULT_SRC_DIR}]`, DEFAULT_SRC_DIR)
  .option('-i --ignore-src <glob>', 'glob pattern for sub-package paths that should be ignored')
  .option('-l --link <regex>', 'regex pattern for dependencies that should be linked, not installed');

createCommand('status', 'Show an overview of the monorepo status')
.action((cmd) => status(cmd.opts()));

createCommand('bootstrap', 'Install external dependencies and create internal links')
.option('--prod --production', 'skip external and internal development-only dependencies (also via NODE_ENV=production)')
.action((cmd) => bootstrap(cmd.opts()));

createCommand('clean', 'Delete all node_modules directories from sub-packages')
.action((cmd) => clean(cmd.opts()));

createCommand('add <sub-package> <packages...>', 'Add dependencies to a sub-package')
.option('-D --dev', 'add to `devDependencies` instead of `dependencies`')
.option('-P --peer', 'add to `peerDependencies` instead of `dependencies`')
.option('-O --optional', 'add to `optionalDependencies` instead of `dependencies`')
.option('-E --exact', 'install the exact version')
.option('-T --tilde', 'install the most recent release with the same minor version')
.action((subpackage, deps, cmd) => addRemoveUpgrade(subpackage, 'add', deps, cmd.opts()));

createCommand('remove <sub-package> <packages...>', 'Remove dependencies from a sub-package')
.action((subpackage, deps, cmd) => addRemoveUpgrade(subpackage, 'remove', deps, cmd.opts()));

createCommand('upgrade <sub-package> [packages...]', 'Upgrade some/all dependencies of a package')
.option('--ignore-engines', 'disregard engines check during upgrade')
.action((subpackage, deps, cmd) => addRemoveUpgrade(subpackage, 'upgrade', deps, cmd.opts()));

createCommand('outdated', 'Check for outdated dependencies')
.action((cmd) => outdated(cmd.opts()));

createCommand('prepublish', 'Prepare for a release: validate versions, copy READMEs and package.json attrs')
.option('--copy-attrs <attrs>', `copy these package.json attrs to sub-packages [${DEFAULT_COPY_ATTRS}]`, DEFAULT_COPY_ATTRS)
.action((cmd) => prepublish(cmd.opts()));

createCommand('publish', 'Publish updated sub-packages')
.option('--no-master', 'allow publishing from a non-master branch')
.option('--no-check-uncommitted', 'skip uncommitted check')
.option('--no-check-unpulled', 'skip unpulled check')
.option('--no-confirm', 'do not ask for confirmation before publishing')
.option('--no-git-commit', 'skip the commit-tag-push step before publishing')
.option('--no-npm-publish', 'skip the npm publish step')
.option('--new-version <version>', 'use this version for publishing, instead of asking')
.option('--increment-version-by <major|minor|patch|rc|beta|alpha>', 'increment version by this, instead of asking')
.option('--publish-tag <tag>', 'publish with a custom tag (instead of `latest`)')
.option('--changelog-path <path>', `changelog path [${DEFAULT_CHANGELOG}]`, DEFAULT_CHANGELOG)
.option('--no-changelog', 'skip changelog updates')
.action((cmd) => publish(cmd.opts()));

createCommand('reset-all-versions <version>', 'Reset all versions (incl. monorepo package) to the specified one')
.option('--no-confirm', 'do not ask for confirmation')
.action((version, cmd) => { resetAllVersions(version, cmd.opts()); });

createCommand('all <command>', 'Run a given command on all sub-packages')
.option('--parallel', 'run command in parallel on all sub-packages')
.option('--no-parallel-logs', 'use chronological logging, even in parallel mode')
.option('--ignore-errors', 'do not stop even if there are errors in some packages')
.action((command, cmd) => { all(command, cmd.opts()); });

process.on('unhandledRejection', (err) => {
  console.error(err);  // eslint-disable-line
  process.exit(1);
});
process.on('SIGINT', () => { process.exit(0); });

program.command('*', '', { noHelp: true })
.action(() => program.outputHelp());
if (process.argv.length <= 2) program.outputHelp();

program.parse(process.argv);
