import test from "node:test";
import assert from "node:assert/strict";
import { parse, sym, type AST } from "./parser.mts";

test("test framework works", () => {
  assert.strictEqual(1, 1);
});

test("empty string program", () => {
  assert.deepEqual<AST>(parse(""), { rules: [] });
});

test("whitespace-only program", () => {
  assert.deepEqual<AST>(parse(" \t\n"), { rules: [] });
});

// shrug, coverage
test("two empty rules and then a normal rule", () => {
  assert.deepEqual<AST>(parse("|||||:so: simple| :isn't: it"), {
    rules: [
      { causes: [], effects: [] },
      { causes: [], effects: [] },
      {
        causes: [{ stack: "so", symbols: [sym("simple")] }],
        effects: [{ stack: "isn't", symbols: [sym("it")] }],
      },
    ],
  });
});

test("single stack nullary cause with no effect", () => {
  assert.deepEqual<AST>(parse("|:simple:|"), {
    rules: [
      {
        causes: [{ stack: "simple", symbols: [sym("")] }],
        effects: [],
      },
    ],
  });
});

test("single stack unary cause with no effect", () => {
  assert.deepEqual<AST>(parse("|:so: simple|"), {
    rules: [
      {
        causes: [{ stack: "so", symbols: [sym("simple")] }],
        effects: [],
      },
    ],
  });
});

test("no cause with single stack nullary effect", () => {
  assert.deepEqual<AST>(parse("|| :pack:"), {
    rules: [
      {
        causes: [],
        effects: [{ stack: "pack", symbols: [sym("")] }],
      },
    ],
  });
});

test("no cause with single stack unary effect", () => {
  assert.deepEqual<AST>(parse("|| :finger: ring"), {
    rules: [
      {
        causes: [],
        effects: [{ stack: "finger", symbols: [sym("ring")] }],
      },
    ],
  });
});

test("empty stack name in causes and effects", () => {
  assert.deepEqual<AST>(parse("|:: here | :: there"), {
    rules: [
      {
        causes: [{ stack: "", symbols: [sym("here")] }],
        effects: [{ stack: "", symbols: [sym("there")] }],
      },
    ],
  });
});

test("multiple n-ary causes and effects", () => {
  assert.deepEqual<AST>(
    parse(
      "|:left hand: big sword :right hand: small shield| :attack: pretty good :defense: not great",
    ),
    {
      rules: [
        {
          causes: [
            {
              stack: "left hand",
              symbols: [sym("big"), sym("sword")],
            },
            {
              stack: "right hand",
              symbols: [sym("small"), sym("shield")],
            },
          ],
          effects: [
            {
              stack: "attack",
              symbols: [sym("pretty"), sym("good")],
            },
            {
              stack: "defense",
              symbols: [sym("not"), sym("great")],
            },
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
  assert.deepEqual<AST>(parse(program), {
    rules: [
      {
        causes: [
          {
            stack: "weather",
            symbols: [sym("is"), sym("gray")],
          },
        ],
        effects: [
          {
            stack: "sit",
            symbols: [sym("on"), sym("couch")],
          },
        ],
      },
      {
        causes: [
          {
            stack: "sky",
            symbols: [sym("is"), sym("sunny")],
          },
        ],
        effects: [
          {
            stack: "lie down",
            symbols: [sym("in"), sym("the"), sym("park")],
          },
        ],
      },
    ],
  });
});

test("keep `?` works in cause but not effect ", () => {
  const program = `
  |:cat: meow? :dog: bark | :this: does not flip keep flag?
  |:snake: hiss?| 
  `;
  assert.deepEqual<AST>(parse(program), {
    rules: [
      {
        causes: [
          {
            stack: "cat",
            symbols: [sym("meow")],
            keep: true,
          },
          { stack: "dog", symbols: [sym("bark")] },
        ],
        effects: [
          {
            stack: "this",
            symbols: [
              sym("does"),
              sym("not"),
              sym("flip"),
              sym("keep"),
              sym("flag?"),
            ],
          },
        ],
      },
      {
        causes: [
          {
            stack: "snake",
            symbols: [sym("hiss")],
            keep: true,
          },
        ],
        effects: [],
      },
    ],
  });
});

test("symbols can be variables in any position", () => {
  const program = `
  |:: abcd $efgh :ijkl: lm $no pq | :rst: uv $wx :yz: now $I know $my abcs
`;
  assert.deepEqual<AST>(parse(program), {
    rules: [
      {
        causes: [
          {
            stack: "",
            symbols: [sym("abcd"), sym("efgh", "variable")],
          },
          {
            stack: "ijkl",
            symbols: [sym("lm"), sym("no", "variable"), sym("pq")],
          },
        ],
        effects: [
          {
            stack: "rst",
            symbols: [sym("uv"), sym("wx", "variable")],
          },
          {
            stack: "yz",
            symbols: [
              sym("now"),
              sym("I", "variable"),
              sym("know"),
              sym("my", "variable"),
              sym("abcs"),
            ],
          },
        ],
      },
    ],
  });
});

test("symbols with spaces in them", () => {
  const program = `
  |:an easy one: [look i can] and not |:an easy one: [look i can] and not 
  `;
  assert.deepEqual<AST>(parse(program), {
    rules: [
      {
        causes: [
          {
            stack: "an easy one",
            symbols: [sym("look i can"), sym("and"), sym("not")],
          },
        ],
        effects: [
          {
            stack: "an easy one",
            symbols: [sym("look i can"), sym("and"), sym("not")],
          },
        ],
      },
    ],
  });
});

test("Rule with no effects before another rule", () => {
  const program = `
  | :dairy: brie |
  | | :produce: some 
`;
  assert.deepEqual<AST>(parse(program), {
    rules: [
      {
        causes: [
          {
            stack: "dairy",
            symbols: [sym("brie")],
          },
        ],
        effects: [],
      },
      {
        causes: [],
        effects: [
          {
            stack: "produce",
            symbols: [sym("some")],
          },
        ],
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
  assert.deepEqual<AST>(parse(program), {
    rules: [
      {
        causes: [
          {
            stack: "f",
            symbols: [sym("abcd")],
          },
        ],
        effects: [
          {
            stack: "qualm",
            symbols: [sym("rabbit"), sym("architect")],
          },
        ],
      },
      {
        causes: [],
        effects: [
          {
            stack: "colors",
            symbols: [sym("can"), sym("be"), sym("blue")],
          },
        ],
      },
      {
        causes: [
          {
            stack: "I",
            symbols: [
              sym("will"),
              sym("keep"),
              sym("this"),
              sym("thank"),
              sym("you"),
            ],
            keep: true,
          },
          {
            stack: "and this too",
            symbols: [sym("please")],
            keep: true,
          },
        ],
        effects: [
          {
            stack: "More#$!@#$%^&() crazy characters",
            symbols: [sym("")],
          },
        ],
      },
    ],
  });
});
