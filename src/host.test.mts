import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { parse, sym } from "./parser.mts";
import { context, execute, type Context } from "./core.mts";
import { evaluateHostSettled } from "./host.mts";

test("evaluateHostSettled with no :@host settled: stack does nothing", () => {
  const ctx = context(parse(""));
  evaluateHostSettled(ctx);
  assert.deepEqual<Context>(ctx, context(parse("")));
});

test("evaluateHostSettled with empty :@host settled: stack does nothing", () => {
  const program = `
  |:@host settled: a|
  ||:@host settled: a
  `;
  const ctx = context(parse(program));
  execute(ctx);
  evaluateHostSettled(ctx);
  const expectedCtx = context(parse(program));
  execute(expectedCtx);
  assert.deepEqual<Context>(ctx, expectedCtx);
});

test("evaluateHostSettled :@host settled: log something", () => {
  const program = `
  ||:@host settled: log a little dream of me
  `;
  const ctx = context(parse(program));
  execute(ctx);
  const originalLog = console.log;
  console.log = mock.fn();
  evaluateHostSettled(ctx);
  //@ts-expect-error
  assert.strictEqual(console.log.mock.callCount(), 1);
  //@ts-expect-error
  assert.deepEqual(console.log.mock.calls[0].arguments, [
    "a little dream of me",
  ]);

  const expectedCtx = context(parse(program));
  expectedCtx.initialized = true;
  expectedCtx.stacks["@host settled"] = [];
  assert.deepEqual<Context>(ctx, expectedCtx);

  console.log = originalLog;
});

test("evaluateHostSettled :@host settled: unknown command", () => {
  const program = `
  ||:@host settled: bulbitate verily
  `;
  const ctx = context(parse(program));
  execute(ctx);
  const originalWarn = console.warn;
  console.warn = mock.fn();
  evaluateHostSettled(ctx);
  //@ts-expect-error
  assert.strictEqual(console.warn.mock.callCount(), 1);
  //@ts-expect-error
  assert.deepEqual(console.warn.mock.calls[0].arguments, [
    ":@host settled: didn't know how to process command 'bulbitate verily'",
  ]);

  const expectedCtx = context(parse(program));
  expectedCtx.initialized = true;
  expectedCtx.stacks["@host settled"] = [];
  assert.deepEqual<Context>(ctx, expectedCtx);

  console.warn = originalWarn;
});
