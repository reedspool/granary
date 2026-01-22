import test from "node:test";
import assert from "node:assert/strict";
import { parse, type AST } from "./parser.mts";
import { context, execute, type Context } from "./core.mts";

test("empty context", () => {
  assert.deepEqual(context(parse("")), {
    ast: parse(""),
    stacks: {},
    initialized: false,
  });
});

test("execute empty context does nothing", () => {
  const ctx = context(parse(""));
  execute(ctx);
  const expectedCtx = context(parse(""));
  expectedCtx.initialized = true;
  assert.deepEqual(ctx, expectedCtx);
});

test("execute only non-matching causes does nothing", () => {
  const program = `
  |:abcd: fff :efef:| :rerere: jajajaja
  `;
  const ctx = context(parse(program));
  execute(ctx);
  const expectedCtx = context(parse(program));
  expectedCtx.initialized = true;
  assert.deepEqual(ctx, expectedCtx);
});

test("execute initial setup on stacks", () => {
  const program = `
  || :starter: up :empty card:
  || :another: one as well! :another: because why not?
  `;
  const ctx = context(parse(program));
  execute(ctx);
  const expectedCtx = context(parse(program));
  expectedCtx.stacks["starter"] = [["up"]];
  expectedCtx.stacks["empty card"] = [[""]];
  expectedCtx.stacks["another"] = [["one as well!"], ["because why not?"]];
  expectedCtx.initialized = true;
  assert.deepEqual(ctx, expectedCtx);
});

test("execute simplest nullary cause", () => {
  const program = `
  |:match me:| :place: apple
  || :match me: 
  `;
  const ctx = context(parse(program));
  execute(ctx);
  const stacks: Context["stacks"] = {};
  stacks["match me"] = [];
  stacks["place"] = [["apple"]];
  assert.deepEqual(ctx.stacks, stacks);
});
