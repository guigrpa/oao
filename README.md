# oao [![npm version](https://img.shields.io/npm/v/oao.svg)](https://www.npmjs.com/package/oao)

An opinionated monorepo management tool

**Note that this is pretty much in an _alpha_ stage**

## Why?

* Works with **yarn**, hence **fast**
* Simple to use
* Helps with monorepo workflows: installing all dependencies, validating version numbers, etc.
* Prevents some typical errors (publishing from a non-master branch or with uncommitted changes)


## Installation

Add `oao` to your development dependencies:

```sh
$ yarn add oao --dev
```

## Usage

To see all CLI options, run `node_modules/.bin/oao --help`:

```
Usage: oao [options] [command]


Commands:

  bootstrap      Install external dependencies and create internal links
  prepublish     Prepare for a release: validate version numbers, copy READMEs and package.json attributes
  publish        Publish those packages that have higher versions than those in the registry
  all <command>  Run a given command on all packages

Options:

  -h, --help     output usage information
  -V, --version  output the version number
```

## [Changelog](https://github.com/guigrpa/oao/blob/master/CHANGELOG.md)


## License (MIT)

Copyright (c) [Guillermo Grau Panea](https://github.com/guigrpa) 2017-

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
