import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { parse, sym } from "./parser.mts";
import { context, type Context } from "./core.mts";
import { createHost, Host } from "./host.mts";

test("empty host from string settles", () => {
  const program = `
  `;
  const host = createHost(program);
  host.settle();
  const expectedCtx = context(parse(program));
  expectedCtx.initialized = true;
  assert.deepEqual<Context>(host.ctx, expectedCtx);
});

test("empty host from context settles", () => {
  const program = `
  `;
  const host = createHost(context(parse(program)));
  host.settle();
  const expectedCtx = context(parse(program));
  expectedCtx.initialized = true;
  assert.deepEqual<Context>(host.ctx, expectedCtx);
});

test("host onStepped called after every step and onSettled called if it settles", () => {
  const program = `
  |:dance:| :yay:
  ||:dance:
  `;
  const host = createHost(program);
  const stepCallback = mock.fn();
  const settleCallback = mock.fn();
  host.onStepped(stepCallback);
  host.onSettled(settleCallback);
  host.step();
  assert.strictEqual(stepCallback.mock.callCount(), 1);
  assert.deepEqual(stepCallback.mock.calls[0]?.arguments, [host.ctx]);
  assert.deepEqual<Host>(stepCallback.mock.calls[0]?.this, host);
  assert.strictEqual(settleCallback.mock.callCount(), 0);
  host.step();
  assert.strictEqual(stepCallback.mock.callCount(), 2);
  assert.deepEqual(stepCallback.mock.calls[1]?.arguments, [host.ctx]);
  assert.deepEqual<Host>(stepCallback.mock.calls[1]?.this, host);
  assert.strictEqual(settleCallback.mock.callCount(), 0);
  host.step();
  assert.strictEqual(stepCallback.mock.callCount(), 3);
  assert.deepEqual(stepCallback.mock.calls[2]?.arguments, [host.ctx]);
  assert.deepEqual<Host>(stepCallback.mock.calls[2]?.this, host);
  assert.strictEqual(settleCallback.mock.callCount(), 1);
  assert.deepEqual(settleCallback.mock.calls[0]?.arguments, [host.ctx]);
  assert.deepEqual<Host>(settleCallback.mock.calls[0]?.this, host);
});

test("host.settle has the same effect as stepping repeatedly.", () => {
  const program = `
  |:dance:| :yay:
  ||:dance:
  `;
  const host = createHost(program);
  const stepCallback = mock.fn();
  const settleCallback = mock.fn();
  host.onStepped(stepCallback);
  host.onSettled(settleCallback);
  host.settle();
  assert.strictEqual(stepCallback.mock.callCount(), 3);
  assert.deepEqual(stepCallback.mock.calls[2]?.arguments, [host.ctx]);
  assert.deepEqual<Host>(stepCallback.mock.calls[2]?.this, host);
  assert.strictEqual(settleCallback.mock.callCount(), 1);
  assert.deepEqual(settleCallback.mock.calls[0]?.arguments, [host.ctx]);
  assert.deepEqual<Host>(settleCallback.mock.calls[0]?.this, host);
});

test("host onStepped successfully takes stuff off of a stack before the program", () => {
  const program = `
  ||:@host: Log this!
  |:@host: $something $else?| :this: shouldn't cause an infinite loop
  `;
  const host = createHost(program);
  const fn = mock.fn();
  host.onStepped((ctx) => {
    // TODO: probably want convenience functions to do this stuff
    fn(ctx.stacks["@host"]?.pop());
  });
  host.settle();
  // Called once for initialization, and once more finding no matches
  assert.strictEqual(fn.mock.callCount(), 2);
  assert.deepEqual(fn.mock.calls[0]?.arguments, [[sym("Log"), sym("this!")]]);
});

test("host.settle traps infinite loops", () => {
  const program = "||:stayin alive: |:stayin alive: ?|";
  const host = createHost(program);
  assert.throws(() => host.settle());
});
