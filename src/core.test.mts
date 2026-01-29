import test from "node:test";
import assert from "node:assert/strict";
import {
  parse,
  pattern,
  rule,
  sym,
  hostSym,
  type Rule,
  type Symbol,
} from "./parser.mts";
import {
  context,
  settle,
  type Context,
  findMatchingRule,
  step,
  push,
  pop,
  maybePopMatchingCause,
} from "./core.mts";

test("empty context", () => {
  assert.deepEqual<Context>(context(parse("")), {
    ast: parse(""),
    stacks: {},
    initialized: false,
    variableAssignments: {},
  });
});

test("findMatchingRule empty context finds nothing", () => {
  const ctx = context(parse(""));
  const found = findMatchingRule(ctx);
  assert.deepEqual<Rule | null>(found, null);
});

test("findMatchingRule never matches initializing rules", () => {
  const ctx = context(parse("||:what is: updog"));
  const found = findMatchingRule(ctx);
  assert.deepEqual<Rule | null>(found, null);
});

test("findMatchingRule does what it says on the tin", () => {
  const ctx = context(parse("|:what is: updog| ||:what is: updog"));
  step(ctx);
  const found = findMatchingRule(ctx);
  const expected: Rule = rule();
  expected.causes.push(pattern("what is", [sym("updog")]));
  assert.deepEqual<Rule | null>(found, expected);
});

test("findMatchingRule can match more symbols than the given effect", () => {
  const program = `
    |:proof: is in the pudding|
    ||:proof: is
    ||:proof: in the :proof: pudding
  `;
  const ctx = context(parse(program));
  step(ctx);
  const found = findMatchingRule(ctx);
  const expected: Rule = rule();
  expected.causes.push(
    pattern("proof", [sym("is"), sym("in"), sym("the"), sym("pudding")]),
  );
  assert.deepEqual<Rule | null>(found, expected);
});

test("findMatchingRule no match with fewer symbols on the stack than the cause", () => {
  const program = `
    ||:goofy: pluto minnie
    |:goofy: daffy pluto minnie
  `;
  const ctx = context(parse(program));
  step(ctx);
  const found = findMatchingRule(ctx);
  assert.deepEqual<Rule | null>(found, null);
});

test("maybePopMatchingCause throws on unexpected mismatch in sizes", () => {
  const program = `
  ||:bunch: two bananas
  `;
  const ctx = context(parse(program));
  settle(ctx);
  assert.throws(() =>
    maybePopMatchingCause(
      ctx,
      pattern("bunch", [
        sym("one"),
        sym("banana"),
        sym("two"),
        sym("two"),
        sym("bananas"),
      ]),
    ),
  );
});

test("step does not settle on initialization", () => {
  {
    const ctx = context(parse(""));
    assert.ok(step(ctx));
    assert.ok(!step(ctx));
  }
  {
    const ctx = context(parse("||:a:"));
    assert.ok(step(ctx));
    assert.ok(!step(ctx));
  }
  {
    const ctx = context(parse("||:a:|:a:|:b:"));
    assert.ok(step(ctx));
    assert.ok(step(ctx));
    assert.ok(!step(ctx));
  }
});

test("step handles all the initializers at once", () => {
  const program = `
    ||:a:
    ||:b:
    |:b:|
    ||:c:
  `;
  const ctx = context(parse(program));
  step(ctx);
  const stacks: Context["stacks"] = {};
  stacks["a"] = [sym()];
  stacks["b"] = [sym()];
  stacks["c"] = [sym()];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
  const found = findMatchingRule(ctx);
  const expected: Rule = rule();
  expected.causes.push(pattern("b", [sym()]));
  assert.deepEqual<Rule | null>(found, expected);
});

test("settle empty context does nothing", () => {
  const ctx = context(parse(""));
  settle(ctx);
  const expectedCtx = context(parse(""));
  expectedCtx.initialized = true;
  assert.deepEqual<Context>(ctx, expectedCtx);
});

test("settle only non-matching causes does nothing", () => {
  const program = `
  |:abcd: fff :efef:| :rerere: jajajaja
  `;
  const ctx = context(parse(program));
  settle(ctx);
  const expectedCtx = context(parse(program));
  expectedCtx.initialized = true;
  assert.deepEqual<Context>(ctx, expectedCtx);
});

test("settle initial setup on stacks", () => {
  const program = `
  || :starter: up :empty card:
  || :another: one as well! :another: because why not?
  `;
  const ctx = context(parse(program));
  settle(ctx);
  const expectedCtx = context(parse(program));
  expectedCtx.stacks["starter"] = [sym("up")];
  expectedCtx.stacks["empty card"] = [sym("")];
  expectedCtx.stacks["another"] = [
    sym("one"),
    sym("as"),
    sym("well!"),
    sym("because"),
    sym("why"),
    sym("not?"),
  ];
  expectedCtx.initialized = true;
  assert.deepEqual<Context>(ctx, expectedCtx);
});

test("settle simplest nullary cause", () => {
  const program = `
  |:match me:| :place: apple
  || :match me:
  `;
  const ctx = context(parse(program));
  settle(ctx);
  const stacks: Context["stacks"] = {};
  stacks["place"] = [sym("apple")];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("settle infinite loop which never settles", () => {
  const program = `
  | :song that never ends: it just goes on and on my friend |
  :song that never ends: it just goes on and on my friend
  || :song that never ends: it just goes on and on my friend
  `;
  const ctx = context(parse(program));
  assert.throws(() => settle(ctx));
  const stacks: Context["stacks"] = {};
  stacks["song that never ends"] = [
    sym("it"),
    sym("just"),
    sym("goes"),
    sym("on"),
    sym("and"),
    sym("on"),
    sym("my"),
    sym("friend"),
  ];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("empty stack name works", () => {
  const program = `
  | :: go go go! | :: okay
  || :: go go go!
  `;
  const ctx = context(parse(program));
  settle(ctx);
  const stacks: Context["stacks"] = {};
  stacks[""] = [sym("okay")];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("previously matching cause then falls through to a narrower cause", () => {
  const program = `
  | :triangle: :square: | :triangle:
  | :triangle: | :circle:
  || :triangle: :square:
  `;
  const ctx = context(parse(program));
  settle(ctx);
  const stacks: Context["stacks"] = {};
  stacks["circle"] = [sym("")];
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
  settle(ctx);
  const stacks: Context["stacks"] = {};
  stacks["dolphin"] = [sym("butter")];
  stacks["answer"] = [sym("gotchya")];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("single symbol variable matches across cause and effect", () => {
  const program = `
  | :tree: $what $height | :how tall: $what $height
  || :tree: very tall
  `;
  const ctx = context(parse(program));
  settle(ctx);
  const stacks: Context["stacks"] = {};
  stacks["how tall"] = [sym("very"), sym("tall")];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("causes which keep their stacks", () => {
  const program = `
  | :produce: some brocolli? :dairy: swiss cheese | :dairy: brie
  | :dairy: brie :produce: some brocolli? |
  || :produce: some brocolli :dairy: swiss cheese
  `;
  const ctx = context(parse(program));
  settle(ctx);
  const stacks: Context["stacks"] = {};
  stacks["produce"] = [sym("some"), sym("brocolli")];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("matching multi-word symbols with variables", () => {
  const program = `
  | :prepare: [birthday party!] | :decorations: streamers
  | :party: $whose $kind | :prepare: $kind :calendar: $whose $kind
  || :party: my [birthday party!]
  `;
  const ctx = context(parse(program));
  settle(ctx);
  const stacks: Context["stacks"] = {};
  stacks["calendar"] = [sym("my"), sym("birthday party!")];
  stacks["decorations"] = [sym("streamers")];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("host expressions in effects evaluate", () => {
  // Make sure you try everything in parser.test.mts test named
  // "Host expressions in effect"
  const program = `
    || :results:
       {.1 + .2} { 1 + 2 } {50 % 4} {"abcd" + " " + 52}
       {true} {5 < 4} {Math.pow(2,25)} {undefined} 
    || :results:
       {false ? 1 : 0} {"}"} 
       {"{}"} {"}{}"} {\`}{}\${true}\`}
       {"\\\"}"}
       {
         42
       } {{ if (5) { return 5 } else { return 6 } }}
    || :weird:
       {() => { return "}" }}
       {new Error(5 * 9)}
  `;
  const ctx = context(parse(program));
  settle(ctx);
  const stacks: Context["stacks"] = {};
  stacks["results"] = [
    hostSym(0.30000000000000004),
    hostSym(3),
    hostSym(2),
    hostSym("abcd 52"),
    hostSym(true),
    hostSym(false),
    hostSym(33554432),
    hostSym(undefined),
    hostSym(0),
    hostSym("}"),
    hostSym("{}"),
    hostSym("}{}"),
    hostSym("}{}true"),
    hostSym('"}'),
    hostSym(42),
    hostSym(5),
  ];
  assert.deepEqual<Context["stacks"][string]>(
    ctx.stacks["results"],
    stacks["results"],
  );
  let sym = ctx.stacks["weird"]![0]!;
  assert.equal(sym.type, "hostValue");
  if (typeof sym.value !== "function") throw new Error();
  assert.equal(sym.value(), "}");
  sym = ctx.stacks["weird"]![1]!;
  assert.equal(sym.type, "hostValue");
  assert.equal(typeof sym.value, "object");
  assert.ok(sym.value instanceof Error);
  assert.equal(sym.value.message, "45");
});

test("host expressions in effects can use variables from causes", () => {
  // Make sure you try everything in parser.test.mts test named
  // "Host expressions in effect"
  const program = `
  ||:nambers: {5}
  |:nambers: $n| :unswers: {$n * 32}
  `;
  const ctx = context(parse(program));
  settle(ctx);
  const stacks: Context["stacks"] = {};
  stacks["unswers"] = [hostSym(160)];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("Arbitrary substrings in causes matching strings in effects", () => {
  const program = `
    ||:party: "We're having a party!"
    |:party: "We"| :us: ya
    |:party: "!" | :exclam: pow!
    |:party: "having " $a " party" | :single letter article: present
    |:party: $a|
  `;
  const ctx = context(parse(program));
  settle(ctx);
  const stacks: Context["stacks"] = {};
  stacks["us"] = [sym("ya")];
  stacks["exclam"] = [sym("pow!")];
  stacks["single letter article"] = [sym("present")];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, stacks);
});

test("push pushes on a non-existant stack", () => {
  const ctx = context(parse(""));
  push(ctx, "non-existant", sym("injected"));
  const expectedStacks: Context["stacks"] = {};
  expectedStacks["non-existant"] = [sym("injected")];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, expectedStacks);
});

test("host.pop works on a non-existant stack", () => {
  const ctx = context(parse(""));
  assert.equal(pop(ctx, "non-existant"), undefined);
});

test("host.pop drops up empty stacks", () => {
  const ctx = context(parse("||:a: :b:"));
  settle(ctx);
  assert.deepEqual<Symbol>(pop(ctx, "a"), sym(""));
  const expectedStacks: Context["stacks"] = {};
  expectedStacks["b"] = [sym("")];
  assert.deepEqual<Context["stacks"]>(ctx.stacks, expectedStacks);
});
