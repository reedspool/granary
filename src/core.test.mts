import test from "node:test";
import assert from "node:assert/strict";
import { parse, sym } from "./parser.mts";
import { context, execute, type Context } from "./core.mts";

test("empty context", () => {
  assert.deepEqual<Context>(context(parse("")), {
    ast: parse(""),
    stacks: {},
    initialized: false,
    variableValuesByName: {},
  });
});

test("execute empty context does nothing", () => {
  const ctx = context(parse(""));
  execute(ctx);
  const expectedCtx = context(parse(""));
  expectedCtx.initialized = true;
  assert.deepEqual<Context>(ctx, expectedCtx);
});

test("execute only non-matching causes does nothing", () => {
  const program = `
  |:abcd: fff :efef:| :rerere: jajajaja
  `;
  const ctx = context(parse(program));
  execute(ctx);
  const expectedCtx = context(parse(program));
  expectedCtx.initialized = true;
  assert.deepEqual<Context>(ctx, expectedCtx);
});

test("execute initial setup on stacks", () => {
  const program = `
  || :starter: up :empty card:
  || :another: one as well! :another: because why not?
  `;
  const ctx = context(parse(program));
  execute(ctx);
  const expectedCtx = context(parse(program));
  expectedCtx.stacks["starter"] = [[sym("up")]];
  expectedCtx.stacks["empty card"] = [[sym("")]];
  expectedCtx.stacks["another"] = [
    [sym("one"), sym("as"), sym("well!")],
    [sym("because"), sym("why"), sym("not?")],
  ];
  expectedCtx.initialized = true;
  assert.deepEqual<Context>(ctx, expectedCtx);
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
  stacks["place"] = [[sym("apple")]];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("execute infinite loop which never settles", () => {
  const program = `
  | :song that never ends: it just goes on and on my friend |
  :song that never ends: it just goes on and on my friend
  || :song that never ends: it just goes on and on my friend
  `;
  const ctx = context(parse(program));
  assert.throws(() => execute(ctx));
  const stacks: Context["stacks"] = {};
  stacks["song that never ends"] = [
    [
      sym("it"),
      sym("just"),
      sym("goes"),
      sym("on"),
      sym("and"),
      sym("on"),
      sym("my"),
      sym("friend"),
    ],
  ];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("empty stack name works", () => {
  const program = `
  | :: go go go! | :: okay
  || :: go go go!
  `;
  const ctx = context(parse(program));
  execute(ctx);
  const stacks: Context["stacks"] = {};
  stacks[""] = [[sym("okay")]];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("previously matching cause then falls through to a narrower cause", () => {
  const program = `
  | :triangle: :square: | :triangle:
  | :triangle: | :circle:
  || :triangle: :square:
  `;
  const ctx = context(parse(program));
  execute(ctx);
  const stacks: Context["stacks"] = {};
  stacks["triangle"] = [];
  stacks["square"] = [];
  stacks["circle"] = [[sym("")]];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("single symbol variable matches across two causes", () => {
  const program = `
  | :dolphin: $food :porpoise: $food | :answer: nope
  | :narwhal: $food :porpoise: $food | :answer: gotchya
  || :porpoise: cranberry
  || :narwhal: cranberry
  || :dolphin: butter
  `;
  const ctx = context(parse(program));
  execute(ctx);
  const stacks: Context["stacks"] = {};
  stacks["dolphin"] = [[sym("butter")]];
  stacks["narwhal"] = [];
  stacks["porpoise"] = [];
  stacks["answer"] = [[sym("gotchya")]];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("single symbol variable matches across cause and effect", () => {
  const program = `
  | :tree: $what $height | :how tall: $what $height
  || :tree: very tall
  `;
  const ctx = context(parse(program));
  execute(ctx);
  const stacks: Context["stacks"] = {};
  stacks["tree"] = [];
  stacks["how tall"] = [[sym("very"), sym("tall")]];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("causes which keep their stacks", () => {
  const program = `
  | :produce: some brocolli? :dairy: swiss cheese | :dairy: brie
  | :dairy: brie :produce: some brocolli? |
  || :produce: some brocolli :dairy: swiss cheese
  `;
  const ctx = context(parse(program));
  execute(ctx);
  const stacks: Context["stacks"] = {};
  stacks["produce"] = [[sym("some"), sym("brocolli")]];
  stacks["dairy"] = [];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});
