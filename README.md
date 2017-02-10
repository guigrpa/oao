# oao :package: [![npm version](https://img.shields.io/npm/v/oao.svg)](https://www.npmjs.com/package/oao)

A Yarn-based, opinionated monorepo management tool.


## Why? :sparkles:

* Works with **yarn**, hence (relatively) **fast**.
* **Simple to use** and extend (hope so!).
* Provides a number of monorepo **workflow enhancers**: installing all dependencies, validating version numbers, determining updated packages, publishing everything at once, etc.
* **Prevents some typical publish errors** (using a non-master branch, uncommitted/non-pulled changes).


## Assumptions :thought_balloon:

As stated in the tagline, *oao* is somewhat opinionated and makes the following assumptions on your monorepo:

* It uses a **synchronized versioning scheme**. In other words: a *master version* is configured in the root-level `package.json`, and other packages will be in sync with that version (whenever they are updated). Some packages can be *left behind* version-wise if they're not updated, but they'll jump to the master version when they get some love.
* You use **git** for version control and have already initialised your repo.
* **Git tags** are used for releases (and *only* for releases), and follow semver: `v0.1.3`, `v2.3.5`, `v3.1.0-rc.1` and so on.
* Some packages may be public, others private (flagged `"private": true` in `package.json`). OK, *no assumption here*: rest assured that no private packages will be published by mistake.


## Installation

If *yarn* is not installed in your system, please [install it first](https://yarnpkg.com/en/docs/install).

Add **oao** to your development dependencies:

```sh
$ yarn add oao --dev
```

*Note: If you value command-line convenience higher than tight dependency control, consider a global installation (e.g. `npm install --global oao`).*


## Usage

To see all CLI options, run `oao --help`:

```
Usage: oao [options] [command]

Commands:

  bootstrap [options]                     Install external dependencies and create internal links
  prepublish [options]                    Prepare for a release: validate version numbers, copy READMEs and package.json attributes
  publish [options]                       Publish updated packages
  reset-all-versions [options] <version>  Reset all versions (incl. monorepo package) to the specified one
  all [options] <command>                 Run a given command on all packages

Options:

  -h, --help     output usage information
  -V, --version  output the version number
```

You can also get help from particular commands, which may have additional options, e.g. `oao publish --help`:

```
Usage: publish [options]

Publish updated packages

Options:

  -h, --help          output usage information
  -s --src <pattern>  Glob pattern for package paths [packages/*]
```


## Main commands

### `oao bootstrap`

Installs all package dependencies using **yarn**. External dependencies are installed normally, whereas those belonging to the monorepo itself are `yarn link`ed.


### `oao prepublish`

Carries out a number of chores that are needed before publishing:

* Checks that all version numbers are valid and <= the master version.
* Copies `<root>/README.md` to the *main* package (the one having the same name as the monorepo).
* Copies `<root>/README-LINK.md` to all other packages.
* Copies several fields from the root `package.json` to all other `package.json` files: `description`, `keywords`, `author`, `license`, `homepage`, `bugs`, `repository`.


### `oao publish`

Carries out a number of steps:

* Asks the user for confirmation that it has *built* all packages for publishing (using something like `yarn build`).
* Performs a number of checks:
    - The current branch should be `master`.
    - No uncommitted changes should remain in the working directory.
    - No unpulled changes should remain.
* Determines which packages need publishing (those which have changed with respect to the last tagged version).
* Asks the user for an incremented master version (major, minor, patch or pre-release major), that will be used for the root package as well as all updated packages.
* Asks the user for final confirmation before publishing.
* Updates versions in `package.json` files, commits the updates, adds a tag and pushes all the changes.
* Publishes updated packages.


### `oao all <command>`

Executes the specified command on all packages (private ones included), with the package's root as *current working directory*. Examples:

```sh
$ oao all ls
$ oao all "ls -al"
$ oao all "yarn run compile"
```


## Credits :clap:

* [lerna](https://github.com/lerna/lerna): for general inspiration.
* [yarn](https://yarnpkg.com): for a fast, secure and reliable way to do dependency management.
* [np](https://github.com/sindresorhus/np): for the prepublish checks.


## Why *oao*? :sunglasses:

Basically, many other names I could come up with were either too boring (*mono-repo*), or already taken. *oao* stands for *one and only* :grimacing:, which is a reference to the individual nature of monorepos, as well as a beautiful song by Adele. Yes, I agree it's far-fetched, but extremely short and convenient!


## [Changelog](https://github.com/guigrpa/oao/blob/master/CHANGELOG.md) :scroll:


## License (MIT) :books:

Copyright (c) [Guillermo Grau Panea](https://github.com/guigrpa) 2017-now

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
