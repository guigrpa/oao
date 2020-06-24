## 1.9.0 (2020-6-24)

- Allow publishing from the `main` branch by default, in addition to `master` (jeroenptrs, #98).

## 1.8.0 (2020-1-28)

- Limit `parallelLimit` by number of cpus by default (SimenB, #92).

## 1.7.0 (2019-8-13)

- Add `--no-bump` for `oao publish`, useful in CI/CD environments (#83).

## 1.6.1 (2019-8-11)

- Bump dependencies. Remove @babel/polyfill since it's not needed in Node 6+.

## 1.6.0 (2019-2-20)

- Add `oao remove-all` (removes a dependency throughout the monorepo) (#80).

## 1.5.1 (2018-3-21)

- Fix bug in `oao all` and `oao run-script` which caused incorrect serial execution (#72).

## 1.5.0 (2018-3-19)

- Add `oao bump` (upgrades a dependency across all sub-packages) (#28).

## 1.5.0-beta.0 (2018-3-14)

- Add `--parallel-limit <#processes>` to `oao all` and `oao run-script`, to limit concurrency when running things in parallel (#69).
- Allow simultaneous usage of `--parallel` and `--tree` for `oao all` and `oao run-script`. In this case, jobs may block if other jobs associated to dependent subpackages are still pending (#68).
- `oao run-script`: add the possibility to generate more than one job per subpackage (e.g. `oao run-script test:*`) (#70).

## 1.4.1 (2018-3-12)

- Fix issues caused by new yarn `workspaces` semantics (#71, #67).

## 1.4.0 (2018-2-16)

- Add `--relative-time` to all commands, shortening the date column in logs by
  14 characters (#64).

## 1.3.1 (2018-2-13)

- Add `--no-checks` for `oao publish` (removes all prepublish checks), useful in
  some cases (#62).

## 1.3.0 (2018-2-13)

- Add support for extra arguments in `oao all`, e.g. `oao all ls -- -al` is now
  equivalent to `oao all 'ls -al'` (#61).

## 1.2.1 (2017-11-24)

- Remove subpackage prefix in logs generated with `oao all` and `oao run-script`
  when not running in parallel.

## 1.2.0 (2017-11-24)

- Improve error logging with `oao all` and `oao run-script` in parallel mode --
  re-print the whole stderr contents at the end (#57).
- Add subpackage prefix to all logs in `oao all` and `oao run-script` (related
  to #57).

## 1.1.0 (2017-11-24)

- Add `--tree` to `oao all` and `oao run-script` (follows dependency tree,
  starting with the tree leaves and going upwards) (closes issue #58).

## 1.0.0 (2017-11-11)

- Bump to 1.0.0. No breaking changes expected (at least not so often).

## 0.10.5 (2017-11-11)

- Add **`oao run-script`** (#55, @kevroadrunner).

## 0.10.4 (2017-10-10)

- Log error code when external command fails and prevent some log redundancy
  (#52).

## 0.10.3 (2017-10-6)

- Improve error detail when running `oao status` and some package has an invalid
  `name` in its `package.json` (#40).

## 0.10.2 (2017-10-6)

- Set `process.env.YARN_SILENT` to 0, so that yarn's output is not removed in
  some cases (#50, see also https://github.com/yarnpkg/yarn/pull/3536,
  https://github.com/yarnpkg/yarn/issues/4615).
- Ignore `yarn outdated`'s non-zero error code when it finds outdated packages
  (#50).

## 0.10.1 (2017-9-13)

- Bugfix: in `oao add|remove|upgrade`, fix handling of scoped packages (#45).

## 0.10.0 (2017-8-23)

## 0.10.0-beta.3 (2017-8-18)

- Add support for **non-monorepo publishing** Use the `oao publish --single` to
  indicate that your root package is _not_ a monorepo, and you can benefit from
  oao's features even in normal packages: publishing checks, automatic tagging,
  interactive version selection, etc.

## 0.10.0-beta.2 (2017-8-17)

## 0.10.0-beta.1 (2017-8-16)

- Add support for **yarn workspaces**. This mode is enabled automatically when
  the root package.json has a `workspaces` field, which overrides any other
  `src` option.

## 0.9.0 (Jul. 15, 2017)

- Experimentally add the possibility to specify some config options in
  package.json (#47).

## 0.8.5 (Jun. 16, 2017)

- Add **`--increment-version-by` option for `oao publish`**. This allows setting
  the next version automatically, e.g. in a continuous deployment scheme (#41).
- Add prettier.

## 0.8.4 (Jun. 16, 2017)

- Bugfix: in parallel `oao bootstrap`, recover original subpackage
  `package.json` files always, even if one of the subpackages fails to install
  (#42).

## 0.8.3 (Jun. 15, 2017)

- Parallelize `oao bootstrap` -- **substantially improved performance** (#42).
- Add support for `--frozen-lockfile`, `--pure-lockfile` and `--no-lockfile`
  flags in `oao bootstrap` (see Yarn documentation) (#43).

## 0.8.2 (Apr. 14, 2017)

- Bump deps

## 0.8.1 (Apr. 3, 2017)

- Add `--ignore-src <glob>` option to all commands to exclude sub-packages
  (#38).
- Add warning to `oao oudated` for internal deps that do not meet the specified
  version range (#34).

## 0.8.0 (Mar. 8, 2017)

- Rename `--version` option (incompatible with `commander`'s default option') to
  `--new-version` (#35).
- During `oao publish`, automatically **update the changelog** with the new
  version and release date.
- Add **`--no-npm-publish` option to `oao publish`** to prevent accidental
  publishing on npm of parts of an all-private monorepo.
- During `oao publish`, also **update the versions of _private_ sub-packages**
  that have changed.

## 0.7.3 (Mar. 4, 2017)

- Add more granular configuration options for `oao publish`:
  `--no-check-uncommitted`, `--no-check-unpulled`, `--no-git-commit` (#29).
- Add `--version <new-version>` option to `oao publish` (overrides manual
  version specification) (#30).

## 0.7.2 (Mar. 1, 2017)

- When executing a command, inhibit `stdin` access on Windows (see
  [this](https://github.com/nodejs/node/issues/10836) and
  [this](https://github.com/yarnpkg/yarn/issues/2462)).

## 0.7.1 (Feb. 28, 2017)

- Add **`oao clean`** to remove all `node_modules` directories in sub-packages.
- Provide **more explicit errors when unhandled rejections occur**.
- Add `--no-confirm` option to `oao reset-all-versions` (#26).
- Extract Parallel Console (now published as
  `storyboard-listener-console-parallel` under the Storyboard monorepo).

## 0.7.0 (Feb. 27, 2017)

- Add support for **internal links in `oao add|remove|upgrade`** (#17).
- Add support for `oao add|remove|upgrade` on the root package (use either `.`
  or `ROOT` as package name).

## 0.6.1 (Feb. 26, 2017)

- Remove extra blank lines (above the fold) caused when clearing the terminal in
  parallel logs (#18).
- Show help when user enters no valid command.

## 0.6.0 (Feb. 25, 2017)

- Also process the monorepo root during `oao bootstrap`, including links to
  sub-packages (if any) (#24).
- Modify `oao status` so that it provides more accurate information (e.g. in git
  repos with no tags, no upstream, etc.) (#23).
- Warn during `oao bootstrap` when linked package version does not satisfy the
  required range (#25).

## 0.5.7 (Feb. 24, 2017)

- Add **`oao outdated`**: runs `yarn outdated` on all sub-packages and the root
  package, taking care that internal and custom links are omitted.
- Add **`--production` option** to `oao bootstrap`: skip external and internal
  development-only dependencies (also available by setting the `NODE_ENV`
  environment variable to `production`) (#19). See also discussion in #16.
- Filter sub-package paths, keeping only those that contain a `package.json`
  file (#20).

## 0.5.6 (Feb. 23, 2017)

- Allow `--src` pattern to have a trailing slash (optional).
- Other minor tweaks.

## 0.5.5 (Feb. 22, 2017)

- Add **parallel logging in `oao all`** (can be disabled using the
  `--no-parallel-logs` option) (#10).

## 0.5.4 (Feb. 21, 2017)

- Add **parallel support to `oao all`**, using the `--parallel` and
  `--ignore-errors` options (#10, #13).
- Bugfix: filter out non-directory paths from globby results (#11).

## 0.5.3 (Feb. 20, 2017)

- Add **`oao status`**: provides lots of information on the monorepo.
- Add **`--link <regex>` option** to force some packages to be linked, not
  installed (useful in some development environments). Used in `oao bootstrap`
  and `oao add|remove|upgrade`.
- Add **`--ignore-engines` option** to `oao upgrade` (passed through to Yarn).
- Add **`--copy-attrs` option** to `oao prepublish` (attributes that are copied
  to the sub-package's `package.json` file).

## 0.5.2 (Feb. 16, 2017)

- Add **tentative support for scoped packages** (#7).
- Internal:
  - Add unit tests.
  - Add static types (Flow).

## 0.5.1 (Feb. 15, 2017)

- Add **`oao upgrade <sub-package> [deps...]`**.
- Add unit tests, Travis, Coveralls.

## 0.5.0 (Feb. 14, 2017)

- Add **`oao add <sub-package> <deps...>`**.
- Add **`oao remove <sub-package> <deps...>`**.
- Bump `storyboard` yet again (some warnings remained).
- Fix missing newlines at the end of `package.json` files (#3).

## 0.4.1 (Feb. 13, 2017)

- Bump `storyboard` (prevents "unmet peer dependency" during installation).

## 0.4.0 (Feb. 12, 2017)

- Greatly reduce the number of oao dependencies by bumping `storyboard` to v3
  (prerelease).
- Add **`--publish-tag <tag>` option** to `oao publish`: (publishes with a
  custom tag, instead of `latest`).

## 0.3.3 (Feb. 12, 2017)

- Fix bad repo links in `package.json`.

## 0.3.2 (Feb. 12, 2017)

- Bugfixes:
  - Fix prerelease version updates.
  - Move `babel-polyfill` to `dependencies` (#2).
  - Prevent normal `git push` output from being shown as errors.

## 0.3.0, 0.3.1 (Feb. 12, 2017)

- Add options to `oao publish`:
  - `--no-master` (allow publishing from non-`master` branches).
  - `--no-confirm` (skip confirmation steps).

## 0.2.0 (Feb. 10, 2017)

- Automatically detect updated packages, allow user selection of
  major/minor/patch/prerelease increment, commit, tag, push and publish.
- Allow custom package directories.
- Improve docs.

## 0.1.0 (Feb. 9, 2017)

- First public release.
