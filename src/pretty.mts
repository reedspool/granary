import type { Context, Tuple } from "./core.mts";

export const prettyTuple: (tuple: Tuple) => string = (tuple) =>
  tuple.map(({ value }) => value).join(" ");

export const prettyStacks: (stacks: Context["stacks"]) => string = (stacks) => {
  const strs = [];
  for (const [name, tuples] of Object.entries(stacks)) {
    strs.push(
      `:${name}: ${
        tuples.length === 0
          ? "<empty>"
          : tuples.map((tuple) => prettyTuple(tuple)).join(", ")
      }`,
    );
  }
  return strs.join("\n");
};
