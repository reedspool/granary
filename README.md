# Nova in TypeScript

A version of Nova in TypeScript

## Tasks

[![xc compatible](https://xcfile.dev/badge.svg)](https://xcfile.dev)

### install

```sh
npm install
cd web
npm install
```

### test

interactive: true

```sh
node --test --experimental-test-coverage
```

### test-watch

interactive: true

```sh
node --test --experimental-test-coverage --watch
```

### example

interactive: true

```
node src/example-usage.mts
```

### example-debug

interactive: true

```
node --inspect-brk src/example-usage.mts
```

### build

Configured in `tsdown.config.mts`

```sh
npx tsdown
```

### build-watch

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

```sh
cd web;
npm run dev
```

### web-build

```sh
cd web;
npm run build
```
