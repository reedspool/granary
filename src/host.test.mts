import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { parse, parseRule, sym, type AST } from "./parser.mts";
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
    fn(ctx.stacks["@host"]?.splice(0, ctx.stacks["@host"].length));
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

test("host.settleWith with no options is the same as settle", () => {
  const program = "||:du: hast |:du: $a| :was: $a";
  const hostForSettle = createHost(program);
  const hostForSettleWithNoOpts = createHost(program);
  const hostForSettleWithEmptyOpts = createHost(program);

  hostForSettle.settle();
  hostForSettleWithNoOpts.settleWith();
  hostForSettleWithEmptyOpts.settleWith();
  assert.deepEqual<Context>(hostForSettle.ctx, hostForSettleWithNoOpts.ctx);
  assert.deepEqual<Context>(hostForSettle.ctx, hostForSettleWithEmptyOpts.ctx);
});

test("host.settleWith can prepend rules for a single execution", () => {
  const program = "||:i: believe";
  const host = createHost(program);
  const hostWithExpectedAst = createHost(program);
  host.settle();
  hostWithExpectedAst.settle();

  host.settleWith({
    prepend: [parseRule("|:i: $a | :you: $a")],
  });
  assert.deepEqual<AST>(host.ctx.ast, hostWithExpectedAst.ctx.ast);
  const expectedStacks: Context["stacks"] = {};
  expectedStacks["i"] = [];
  expectedStacks["you"] = [sym("believe")];
  assert.deepEqual<Context["stacks"]>(host.ctx.stacks, expectedStacks);
});

test("host.settleWith can append rules for a single execution", () => {
  const program = "||:i: believe";
  const host = createHost(program);
  const hostWithExpectedAst = createHost(program);
  host.settle();
  hostWithExpectedAst.settle();

  host.settleWith({
    append: [parseRule("|:i: $a | :we: $a")],
  });
  assert.deepEqual<AST>(host.ctx.ast, hostWithExpectedAst.ctx.ast);
  const expectedStacks: Context["stacks"] = {};
  expectedStacks["i"] = [];
  expectedStacks["we"] = [sym("believe")];
  assert.deepEqual<Context["stacks"]>(host.ctx.stacks, expectedStacks);
});

test("host.settleWith runs any initializers appended or prepended", () => {
  const program = "||:i: believe";
  const host = createHost(program);
  const hostWithExpectedAst = createHost(program);
  host.settle();
  hostWithExpectedAst.settle();

  host.settleWith({
    prepend: [parseRule("|| :you:"), parseRule("|:i: $a? :you:| :you: $a")],
    append: [parseRule("|:i: $a | :we: $a")],
  });
  assert.deepEqual<AST>(host.ctx.ast, hostWithExpectedAst.ctx.ast);
  const expectedStacks: Context["stacks"] = {};
  expectedStacks["i"] = [];
  expectedStacks["you"] = [sym("believe")];
  expectedStacks["we"] = [sym("believe")];
  assert.deepEqual<Context["stacks"]>(host.ctx.stacks, expectedStacks);
});
