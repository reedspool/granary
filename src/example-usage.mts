import { parse, context, execute } from "./index.mts";

const program = `
  | :produce: some brocolli? :dairy: swiss cheese | :dairy: brie
  | :dairy: brie :produce: some brocolli? |
  || :produce: some brocolli :dairy: swiss cheese
  `;

const ast = parse(program);
const ctx = context(ast);
execute(ctx);

console.log("Stacks:");
for (const [name, tuples] of Object.entries(ctx.stacks)) {
  console.log(
    `:${name}: ${
      tuples.length === 0
        ? "<empty>"
        : tuples
            .map((tuple) => tuple.map(({ value }) => value).join(" "))
            .join(", ")
    }`,
  );
}
