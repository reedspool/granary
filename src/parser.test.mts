import test from "node:test";
import assert from "node:assert/strict";
import { parse, type AST } from "./parser.mts";

test("test framework works", () => {
  assert.strictEqual(1, 1);
});

test("empty string program", () => {
  assert.deepEqual(parse(""), { rules: [] });
});

test("whitespace-only program", () => {
  assert.deepEqual(parse(" \t\n"), { rules: [] });
});

// shrug, coverage
test("two empty rules and then a normal rule", () => {
  assert.deepEqual(parse("|||||:so: simple| :isn't: it"), {
    rules: [
      {
        causes: [{ stack: "so", symbols: "simple" }],
        effects: [{ stack: "isn't", symbols: "it" }],
      },
    ],
  });
});

test("single stack nullary cause with no effect", () => {
  assert.deepEqual(parse("|:simple:|"), {
    rules: [{ causes: [{ stack: "simple", symbols: "" }], effects: [] }],
  });
});

test("single stack unary cause with no effect", () => {
  assert.deepEqual(parse("|:so: simple|"), {
    rules: [{ causes: [{ stack: "so", symbols: "simple" }], effects: [] }],
  });
});

test("no cause with single stack nullary effect", () => {
  assert.deepEqual(parse("|| :pack:"), {
    rules: [{ causes: [], effects: [{ stack: "pack", symbols: "" }] }],
  });
});

test("no cause with single stack unary effect", () => {
  assert.deepEqual(parse("|| :finger: ring"), {
    rules: [{ causes: [], effects: [{ stack: "finger", symbols: "ring" }] }],
  });
});

test("multiple n-ary causes and effects", () => {
  assert.deepEqual(
    parse(
      "|:left hand: big sword :right hand: small shield| :attack: pretty good :defense: not great",
    ),
    {
      rules: [
        {
          causes: [
            { stack: "left hand", symbols: "big sword" },
            { stack: "right hand", symbols: "small shield" },
          ],
          effects: [
            { stack: "attack", symbols: "pretty good" },
            { stack: "defense", symbols: "not great" },
          ],
        },
      ],
    },
  );
});

test("multiple rules", () => {
  const program = `
  |:weather: is gray | :sit: on couch
  |:sky: is sunny | :lie down: in the park
  `;
  assert.deepEqual(parse(program), {
    rules: [
      {
        causes: [{ stack: "weather", symbols: "is gray" }],
        effects: [{ stack: "sit", symbols: "on couch" }],
      },
      {
        causes: [{ stack: "sky", symbols: "is sunny" }],
        effects: [{ stack: "lie down", symbols: "in the park" }],
      },
    ],
  });
});

test("kitchen sink", () => {
  const program = `
  |!f! abcd | @qualm@ rabbit architect
  || :colors: can be blue
  |:I: will keep this thank you? :and this too: please?|
  :More#$!@#$%^&() crazy characters:
`;
  assert.deepEqual(parse(program), {
    rules: [
      {
        causes: [
          {
            stack: "f",
            symbols: "abcd",
          },
        ],
        effects: [
          {
            stack: "qualm",
            symbols: "rabbit architect",
          },
        ],
      },
      {
        causes: [],
        effects: [
          {
            stack: "colors",
            symbols: "can be blue",
          },
        ],
      },
      {
        causes: [
          {
            stack: "I",
            symbols: "will keep this thank you?",
          },
          {
            stack: "and this too",
            symbols: "please?",
          },
        ],
        effects: [{ stack: "More#$!@#$%^&() crazy characters", symbols: "" }],
      },
    ],
  });
});
