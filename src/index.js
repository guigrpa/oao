#!/usr/bin/env node

/* eslint-disable max-len, global-require, import/no-dynamic-require, no-console */

import path from 'path';
import { addDefaults, merge } from 'timm';
import program from 'commander';
import initConsole from './utils/initConsole';
import { isObject } from './utils/helpers';
import status from './status';
import bootstrap from './bootstrap';
import clean from './clean';
import addRemoveUpgrade from './addRemoveUpgrade';
import removeAll from './removeAll';
import bump from './bump';
import outdated from './outdated';
import prepublish from './prepublish';
import publish from './publish';
import resetAllVersions from './resetAllVersions';
import all from './all';
import runScript from './runScript';

process.env.YARN_SILENT = 0;

const pkg = require('../package.json');

const monorepoPkg = require(path.resolve('package.json'));

const OAO_CONFIG = monorepoPkg.oao || {};
const DEFAULT_SRC_DIR = OAO_CONFIG.src || 'packages/*';
const DEFAULT_COPY_ATTRS =
  'description,keywords,author,license,homepage,bugs,repository';
const DEFAULT_CHANGELOG = 'CHANGELOG.md';

program.version(pkg.version);

// =========================================
// Helpers
// =========================================
const processOptions = options0 => {
  let options = options0;

  if (options.single) {
    options = merge(options, { src: [] });
  } else {
    // If workspaces are enabled in the monorepo, some configuration is
    // overriden by the monorepo package.json
    if (monorepoPkg.workspaces) {
      let src = monorepoPkg.workspaces;
      if (isObject(src)) src = src.packages;
      if (!src) {
        throw new Error('Could not find correct config for Yarn workspaces');
      }
      options = merge(options, { src, workspaces: true });
    }

    // Add extra configuration in the `oao` field of the monorepo package.json
    options = addDefaults(options, { ignoreSrc: OAO_CONFIG.ignoreSrc });
  }

  return options;
};

// Create a command with common options
const createCommand = (syntax, description) =>
  program
    .command(syntax)
    .description(description)
    .option(
      '-s --src <glob>',
      `glob pattern for sub-package paths [${DEFAULT_SRC_DIR}]`,
      DEFAULT_SRC_DIR
    )
    .option(
      '-i --ignore-src <glob>',
      'glob pattern for sub-package paths that should be ignored'
    )
    .option(
      '-l --link <regex>',
      'regex pattern for dependencies that should be linked, not installed'
    )
    .option('--single', 'no subpackages, just the root one')
    .option('--relative-time', 'shorten log dates');

// =========================================
// Commands
// =========================================
createCommand('status', 'Show an overview of the monorepo status').action(
  cmd => {
    const options = processOptions(cmd.opts());
    return status(options);
  }
);

createCommand(
  'bootstrap',
  'Install external dependencies and create internal links'
)
  .option(
    '--prod --production',
    'skip external and internal development-only dependencies (also via NODE_ENV=production)'
  )
  .option('--no-lockfile', "don't read or generate a lockfile")
  .option('--pure-lockfile', "don't generate a lockfile")
  .option(
    '--frozen-lockfile',
    "don't generate a lockfile and fail if an update is needed"
  )
  .option(
    '--no-parallel',
    "don't run yarn install in parallel (use it to debug errors, since parallel logs may be hard to read)"
  )
  .action(cmd => {
    const options = processOptions(cmd.opts());
    initConsole(options);
    return bootstrap(options);
  });

createCommand(
  'clean',
  'Delete all node_modules directories from sub-packages and the root package'
).action(cmd => {
  const options = processOptions(cmd.opts());
  initConsole(options);
  return clean(options);
});

createCommand(
  'add <sub-package> <packages...>',
  'Add dependencies to a sub-package'
)
  .option('-D --dev', 'add to `devDependencies` instead of `dependencies`')
  .option('-P --peer', 'add to `peerDependencies` instead of `dependencies`')
  .option(
    '-O --optional',
    'add to `optionalDependencies` instead of `dependencies`'
  )
  .option('-E --exact', 'install the exact version')
  .option(
    '-T --tilde',
    'install the most recent release with the same minor version'
  )
  .action((subpackage, deps, cmd) => {
    const options = processOptions(cmd.opts());
    initConsole(options);
    return addRemoveUpgrade(subpackage, 'add', deps, options);
  });

createCommand(
  'remove <sub-package> <packages...>',
  'Remove dependencies from a sub-package'
).action((subpackage, deps, cmd) => {
  const options = processOptions(cmd.opts());
  initConsole(options);
  return addRemoveUpgrade(subpackage, 'remove', deps, options);
});

createCommand(
  'remove-all <packages...>',
  'Remove one or several dependencies throughout the monorepo'
).action(async (deps, cmd) => {
  const options = processOptions(cmd.opts());
  initConsole(options);
  await removeAll(deps, options);
  return bootstrap(options);
});

createCommand(
  'upgrade <sub-package> [packages...]',
  'Upgrade some/all dependencies of a package'
)
  .option('--ignore-engines', 'disregard engines check during upgrade')
  .action((subpackage, deps, cmd) => {
    const options = processOptions(cmd.opts());
    initConsole(options);
    return addRemoveUpgrade(subpackage, 'upgrade', deps, options);
  });

createCommand(
  'bump <packages...>',
  'Upgrade one or several dependencies throughout the monorepo (e.g. react@next, timm)'
).action(async (deps, cmd) => {
  const options = processOptions(cmd.opts());
  initConsole(options);
  await bump(deps, options);
  return bootstrap(options);
});

createCommand('outdated', 'Check for outdated dependencies').action(cmd => {
  const options = processOptions(cmd.opts());
  initConsole(options);
  return outdated(options);
});

createCommand(
  'prepublish',
  'Prepare for a release: validate versions, copy READMEs and package.json attrs'
)
  .option(
    '--copy-attrs <attrs>',
    `copy these package.json attrs to sub-packages [${DEFAULT_COPY_ATTRS}]`,
    DEFAULT_COPY_ATTRS
  )
  .action(cmd => {
    const options = processOptions(cmd.opts());
    initConsole(options);
    return prepublish(options);
  });

createCommand('publish', 'Publish updated sub-packages')
  .option(
    '--no-master',
    'allow publishing from a non-master or non-main branch'
  )
  .option('--no-check-uncommitted', 'skip uncommitted check')
  .option('--no-check-unpulled', 'skip unpulled check')
  .option('--no-checks', 'skip all pre-publish checks')
  .option(
    '--no-bump',
    'do not increment version numbers (also disables git commit)'
  )
  .option('--no-confirm', 'do not ask for confirmation before publishing')
  .option('--no-git-commit', 'skip the commit-tag-push step before publishing')
  .option('--no-npm-publish', 'skip the npm publish step')
  .option(
    '--new-version <version>',
    'use this version for publishing, instead of asking'
  )
  .option(
    '--increment-version-by <major|minor|patch|rc|beta|alpha>',
    'increment version by this, instead of asking'
  )
  .option(
    '--publish-tag <tag>',
    'publish with a custom tag (instead of `latest`)'
  )
  .option(
    '--changelog-path <path>',
    `changelog path [${DEFAULT_CHANGELOG}]`,
    DEFAULT_CHANGELOG
  )
  .option('--no-changelog', 'skip changelog updates')
  .option('--otp <code>', 'use 2-factor authentication to publish your package')
  .option('--access <type>', 'publish public or restricted packages')
  .action(cmd => {
    const options = processOptions(cmd.opts());
    initConsole(options);
    return publish(options);
  });

createCommand(
  'reset-all-versions <version>',
  'Reset all versions (incl. monorepo package) to the specified one'
)
  .option('--no-confirm', 'do not ask for confirmation')
  .action((version, cmd) => {
    const options = processOptions(cmd.opts());
    initConsole(options);
    return resetAllVersions(version, options);
  });

createCommand('all <command>', 'Run a given command on all sub-packages')
  .option('--tree', 'follow dependency tree (starting from the tree leaves)')
  .option('--parallel', 'run command in parallel on all sub-packages')
  .option(
    '--no-parallel-logs',
    'use chronological logging, even in parallel mode'
  )
  .option('--parallel-limit <#processes>', 'max number of processes to launch')
  .option(
    '--ignore-errors',
    'do not stop even if there are errors in some packages'
  )
  .action((command, cmd) => {
    // Extract arguments following the first separator (`--`) and
    // add them to the command to be executed
    const { rawArgs } = cmd.parent;
    const idxSeparator = rawArgs.indexOf('--');
    const finalCommand =
      idxSeparator >= 0
        ? [command].concat(rawArgs.slice(idxSeparator + 1)).join(' ')
        : command;
    // Run the `all` command
    const options = processOptions(cmd.opts());
    initConsole(options);
    return all(finalCommand, options);
  });

createCommand('run-script <command>', 'Run a given script on all sub-packages')
  .option('--tree', 'follow dependency tree (starting from the tree leaves)')
  .option('--parallel', 'run script in parallel on all sub-packages')
  .option(
    '--no-parallel-logs',
    'use chronological logging, even in parallel mode'
  )
  .option('--parallel-limit <#processes>', 'max number of processes to launch')
  .option(
    '--ignore-errors',
    'do not stop even if there are errors in some packages'
  )
  .action((command, cmd) => {
    const options = processOptions(cmd.opts());
    initConsole(options);
    return runScript(command, options);
  });

process.on('unhandledRejection', err => {
  console.error(err); // eslint-disable-line
  process.exit(1);
});
process.on('SIGINT', () => {
  process.exit(0);
});

// Syntax error -> show CLI help
program.command('*', '', { noHelp: true }).action(() => program.outputHelp());
if (process.argv.length <= 2) program.outputHelp();

// Let's go!
program.parse(process.argv);
