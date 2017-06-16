## 0.8.5 (Jun. 16, 2017)

* Add **`--increment-version-by` option for `oao publish`**. This allows setting the next version automatically, e.g. in a continuous deployment scheme (#41).
* Add prettier.

## 0.8.4 (Jun. 16, 2017)

* Bugfix: in parallel `oao bootstrap`, recover original subpackage `package.json` files always, even if one of the subpackages fails to install (#42).

## 0.8.3 (Jun. 15, 2017)

* Parallelize `oao bootstrap` -- **substantially improved performance** (#42).
* Add support for `--frozen-lockfile`, `--pure-lockfile` and `--no-lockfile` flags in `oao bootstrap` (see Yarn documentation) (#43).

## 0.8.2 (Apr. 14, 2017)

* Bump deps

## 0.8.1 (Apr. 3, 2017)

* Add `--ignore-src <glob>` option to all commands to exclude sub-packages (#38).
* Add warning to `oao oudated` for internal deps that do not meet the specified version range (#34).

## 0.8.0 (Mar. 8, 2017)

* Rename `--version` option (incompatible with `commander`'s default option') to `--new-version` (#35).
* During `oao publish`, automatically **update the changelog** with the new version and release date.
* Add **`--no-npm-publish` option to `oao publish`** to prevent accidental publishing on npm of parts of an all-private monorepo.
* During `oao publish`, also **update the versions of _private_ sub-packages** that have changed.

## 0.7.3 (Mar. 4, 2017)

* Add more granular configuration options for `oao publish`: `--no-check-uncommitted`, `--no-check-unpulled`, `--no-git-commit` (#29).
* Add `--version <new-version>` option to `oao publish` (overrides manual version specification) (#30).

## 0.7.2 (Mar. 1, 2017)

* When executing a command, inhibit `stdin` access on Windows (see [this](https://github.com/nodejs/node/issues/10836) and [this](https://github.com/yarnpkg/yarn/issues/2462)).

## 0.7.1 (Feb. 28, 2017)

* Add **`oao clean`** to remove all `node_modules` directories in sub-packages.
* Provide **more explicit errors when unhandled rejections occur**.
* Add `--no-confirm` option to `oao reset-all-versions` (#26).
* Extract Parallel Console (now published as `storyboard-listener-console-parallel` under the Storyboard monorepo).

## 0.7.0 (Feb. 27, 2017)

* Add support for **internal links in `oao add|remove|upgrade`** (#17).
* Add support for `oao add|remove|upgrade` on the root package (use either `.` or `ROOT` as package name).

## 0.6.1 (Feb. 26, 2017)

* Remove extra blank lines (above the fold) caused when clearing the terminal in parallel logs (#18).
* Show help when user enters no valid command.

## 0.6.0 (Feb. 25, 2017)

* Also process the monorepo root during `oao bootstrap`, including links to sub-packages (if any) (#24).
* Modify `oao status` so that it provides more accurate information (e.g. in git repos with no tags, no upstream, etc.) (#23).
* Warn during `oao bootstrap` when linked package version does not satisfy the required range (#25).

## 0.5.7 (Feb. 24, 2017)

* Add **`oao outdated`**: runs `yarn outdated` on all sub-packages and the root package, taking care that internal and custom links are omitted.
* Add **`--production` option** to `oao bootstrap`: skip external and internal development-only dependencies (also available by setting the `NODE_ENV` environment variable to `production`) (#19). See also discussion in #16.
* Filter sub-package paths, keeping only those that contain a `package.json` file (#20).

## 0.5.6 (Feb. 23, 2017)

* Allow `--src` pattern to have a trailing slash (optional).
* Other minor tweaks.

## 0.5.5 (Feb. 22, 2017)

* Add **parallel logging in `oao all`** (can be disabled using the `--no-parallel-logs` option) (#10).

## 0.5.4 (Feb. 21, 2017)

* Add **parallel support to `oao all`**, using the `--parallel` and `--ignore-errors` options (#10, #13).
* Bugfix: filter out non-directory paths from globby results (#11).

## 0.5.3 (Feb. 20, 2017)

* Add **`oao status`**: provides lots of information on the monorepo.
* Add **`--link <regex>` option** to force some packages to be linked, not installed (useful in some development environments). Used in `oao bootstrap` and `oao add|remove|upgrade`.
* Add **`--ignore-engines` option** to `oao upgrade` (passed through to Yarn).
* Add **`--copy-attrs` option** to `oao prepublish` (attributes that are copied to the sub-package's `package.json` file).

## 0.5.2 (Feb. 16, 2017)

* Add **tentative support for scoped packages** (#7).
* Internal:
    - Add unit tests.
    - Add static types (Flow).

## 0.5.1 (Feb. 15, 2017)

* Add **`oao upgrade <sub-package> [deps...]`**.
* Add unit tests, Travis, Coveralls.

## 0.5.0 (Feb. 14, 2017)

* Add **`oao add <sub-package> <deps...>`**.
* Add **`oao remove <sub-package> <deps...>`**.
* Bump `storyboard` yet again (some warnings remained).
* Fix missing newlines at the end of `package.json` files (#3).

## 0.4.1 (Feb. 13, 2017)

* Bump `storyboard` (prevents "unmet peer dependency" during installation).

## 0.4.0 (Feb. 12, 2017)

* Greatly reduce the number of oao dependencies by bumping `storyboard` to v3 (prerelease).
* Add **`--publish-tag <tag>` option** to `oao publish`:  (publishes with a custom tag, instead of `latest`).

## 0.3.3 (Feb. 12, 2017)

* Fix bad repo links in `package.json`.

## 0.3.2 (Feb. 12, 2017)

* Bugfixes:
    - Fix prerelease version updates.
    - Move `babel-polyfill` to `dependencies` (#2).
    - Prevent normal `git push` output from being shown as errors.

## 0.3.0, 0.3.1 (Feb. 12, 2017)

* Add options to `oao publish`:
    - `--no-master` (allow publishing from non-`master` branches).
    - `--no-confirm` (skip confirmation steps).

## 0.2.0 (Feb. 10, 2017)

* Automatically detect updated packages, allow user selection of major/minor/patch/prerelease increment, commit, tag, push and publish.
* Allow custom package directories.
* Improve docs.

## 0.1.0 (Feb. 9, 2017)

* First public release.
