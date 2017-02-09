#!/usr/bin/env node
import 'babel-polyfill';
import program from 'commander';
import bootstrap from './bootstrap';
import prepublish from './prepublish';
import publish from './publish';
import forEach from './forEach';

const pkg = require('../package.json');

program.version(pkg.version);

program.command('bootstrap')
.description('Install external dependencies and create internal links')
.action(() => bootstrap());

program.command('prepublish')
.description('Prepare for a release: validate version numbers, copy READMEs and package.json attributes')
.action(() => prepublish());

program.command('publish')
.description('Publish those packages that have higher versions than those in the registry')
.action(() => publish());

program.command('all <command>')
.description('Run a given command on all packages')
.action((command) => { forEach(command); });

program.parse(process.argv);

