# Nova in TypeScript

A version of Nova in TypeScript

## Tasks

[![xc compatible](https://xcfile.dev/badge.svg)](https://xcfile.dev)

### install

```sh
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
