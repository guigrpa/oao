#!/usr/bin/env node

/* eslint-disable max-len */

import 'babel-polyfill';
import program from 'commander';
import 'storyboard-preset-console';
import status from './status';
import bootstrap from './bootstrap';
import addRemoveUpgrade from './addRemoveUpgrade';
import prepublish from './prepublish';
import publish from './publish';
import resetAllVersions from './resetAllVersions';
import all from './all';

const pkg = require('../package.json');

const DEFAULT_SRC_DIR = 'packages/*';
const DEFAULT_COPY_ATTRS = 'description,keywords,author,license,homepage,bugs,repository';

program.version(pkg.version);

const createCommand = (syntax, description) =>
  program.command(syntax).description(description)
  .option('-s --src <glob>', `glob pattern for sub-package paths [${DEFAULT_SRC_DIR}]`, DEFAULT_SRC_DIR)
  .option('-l --link <regex>', 'regex pattern for extra packages that should be linked, not installed');

createCommand('status', 'Show an overview of the monorepo status')
.action((cmd) => status(cmd.opts()));

createCommand('bootstrap', 'Install external dependencies and create internal links')
.action((cmd) => bootstrap(cmd.opts()));

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

createCommand('prepublish', 'Prepare for a release: validate versions, copy READMEs and package.json attrs')
.option('--copy-attrs <attrs>', `copy these package.json attrs to sub-packages [${DEFAULT_COPY_ATTRS}]`, DEFAULT_COPY_ATTRS)
.action((cmd) => prepublish(cmd.opts()));

createCommand('publish', 'Publish updated sub-packages')
.option('--no-master', 'allow publishing from a non-master branch')
.option('--no-confirm', 'do not ask for confirmation before publishing')
.option('--publish-tag <tag>', 'publish with a custom tag (instead of `latest`)')
.action((cmd) => publish(cmd.opts()));

createCommand('reset-all-versions <version>', 'Reset all versions (incl. monorepo package) to the specified one')
.action((version, cmd) => { resetAllVersions(version, cmd.opts()); });

createCommand('all <command>', 'Run a given command on all sub-packages')
.option('--parallel', 'run command in parallel on all sub-packages')
.option('--ignore-errors', 'do not stop even if there are errors in some packages')
.action((command, cmd) => { all(command, cmd.opts()); });

process.on('unhandledRejection', () => {
  process.exit(1);
});

program.parse(process.argv);
