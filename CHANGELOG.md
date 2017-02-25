# Changelog

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
    - Add unit tests
    - Add static types (Flow)

## 0.5.1 (Feb. 15, 2017)

* Add **`oao upgrade <sub-package> [deps...]`**
* Add unit tests, Travis, Coveralls.

## 0.5.0 (Feb. 14, 2017)

* Add **`oao add <sub-package> <deps...>`**
* Add **`oao remove <sub-package> <deps...>`**
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
    - `--no-master` (allow publishing from non-`master` branches)
    - `--no-confirm` (skip confirmation steps)

## 0.2.0 (Feb. 10, 2017)

* Automatically detect updated packages, allow user selection of major/minor/patch/prerelease increment, commit, tag, push and publish.
* Allow custom package directories.
* Improve docs.

## 0.1.0 (Feb. 9, 2017)

* First public release.
