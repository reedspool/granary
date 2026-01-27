import type { Context, Tuple } from "./core.mts";

export const prettyTuple: (
  tuple: Tuple,
  joiner?: string,
  whenEmpty?: string,
) => string = (tuple, joiner = " ", whenEmpty = "<empty>") =>
  tuple.length === 0 ? whenEmpty : tuple.map(({ value }) => value).join(joiner);

export const prettyStacks: (stacks: Context["stacks"]) => string = (stacks) => {
  const strs = [];
  for (const [name, tuple] of Object.entries(stacks)) {
    strs.push(`:${name}: ${prettyTuple(tuple, ", ")}`);
  }
  return strs.join("\n");
};
