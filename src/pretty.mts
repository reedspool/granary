import type { Tuple } from "./core.mts";

export const prettyTuple: (tuple: Tuple) => string = (tuple) =>
  tuple.map(({ value }) => value).join(" ");
