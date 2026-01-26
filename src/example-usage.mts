import { parse, context, settle } from "./index.mts";
import { prettyStacks } from "./pretty.mts";

const program = `
  | :produce: some brocolli? :dairy: swiss cheese | :dairy: brie
  | :dairy: brie :produce: some brocolli? |
  || :produce: some brocolli :dairy: swiss cheese
  `;

const ast = parse(program);
const ctx = context(ast);
settle(ctx);

console.log("Stacks:");
prettyStacks(ctx.stacks);
