#!/usr/bin/env node
import 'babel-polyfill';
import program from 'commander';
import 'storyboard/lib/withConsoleListener';
import bootstrap from './bootstrap';
import prepublish from './prepublish';
import publish from './publish';
import forEach from './forEach';
import resetAllVersions from './resetAllVersions';

const pkg = require('../package.json');

const DEFAULT_SRC_DIR = 'packages/*';

program.version(pkg.version);

const createCommand = (syntax, description) =>
  program.command(syntax).description(description)
  .option('-s --src <pattern>', `Glob pattern for package paths [${DEFAULT_SRC_DIR}]`,
    DEFAULT_SRC_DIR);

createCommand('bootstrap',
  'Install external dependencies and create internal links')
.action((cmd) => bootstrap(cmd.opts()));

createCommand('prepublish',
  'Prepare for a release: validate version numbers, copy READMEs and package.json attributes')
.action((cmd) => prepublish(cmd.opts()));

createCommand('publish',
  'Publish updated packages')
.option('--no-master', 'Allow publishing from a non-master branch')
.option('--no-confirm', 'Do not ask for confirmation before publishing')
.option('--publish-tag <tag>', 'Publish with a custom tag (instead of `latest`)')
.action((cmd) => publish(cmd.opts()));

createCommand('reset-all-versions <version>',
  'Reset all versions (incl. monorepo package) to the specified one')
.action((version, cmd) => { resetAllVersions(version, cmd.opts()); });

createCommand('all <command>',
  'Run a given command on all packages')
.action((command, cmd) => { forEach(command, cmd.opts()); });

program.parse(process.argv);
