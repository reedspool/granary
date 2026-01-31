# Nova in TypeScript

An interpreted implementation of the [Nova Programming
Language](https://nova-lang.net/) with a variant of [the January
syntax](https://nova-lang.net/implementations/#january) in TypeScript for Node
and the Web.

## Tasks

These are the development script snippets.

[![xc compatible](https://xcfile.dev/badge.svg)](https://xcfile.dev)

You can run these scripts easily with [`xc`](https://xcfile.dev), or just copy
them to your terminal. Some lines below like `interactive: true` are for `xc`.

### install

This repository requires NodeJS (only tested with v25). The language
implementation doesn't have any runtime dependencies, but the development
environment for the implementation and the web pages in this repository do have
dependencies. Run this to install all dependencies.

```sh
npm install
cd web
npm install
```

### test

Run all tests for the language implementation once.

interactive: true

```sh
node --test --experimental-test-coverage
```

### test-watch

Run all language implementation tests in "watch mode" so they update on file
changes.

interactive: true

```sh
node --test --experimental-test-coverage --watch
```

### example

If you want to play with the language in NodeJS, an easy way is to edit
`src/example-usage.mts` and run it with this script.

interactive: true

```
node src/example-usage.mts
```

### example-debug

It's nice to use NodeJS's step debugger to watch how the implementation works on
the example file. You'll need Chrome DevTools or another compatible debugger
front-end.

interactive: true

```
node --inspect-brk src/example-usage.mts
```

### cli

Run the CLI to execute source files

interactive: true

```
node cli/src/cli.mts run # --verbose <src.nv>
```

### repl

Run the CLI in REPL mode to execute source files

interactive: true

```
node cli/src/cli.mts repl # --verbose [src.nv]
```

### build-cli

Build the CLI into a single file executable.

```
echo "Not yet implemented, planning to use Node v25.5.0 --build-sea"
exit 1;
```

### build-module

Build the language implementation from its TypeScript source files into a single
JS file for use as a package. Configured in `tsdown.config.mts`

```sh
npx tsdown
```

### build-module-watch

Continuous version of the above, useful for playing with the webpage while
developing the core lib.

```sh
npx tsdown --watch
```

### link-build-to-web

This works, but you MUST run it manually after every build. Would be nice to
have a version which watched the build directory and did this automatically.

```sh
cd web
npm uninstall granary
npm install ../
```

### web-dev

Run the webpage development server. It will show a URL.

```sh
cd web;
npm run dev
```

### web-build

Build the webpage for deployment on a server.

```sh
cd web;
npm run build
```
