import { parse, context, execute } from "./index.mts";

const program = `
  |:match me:| :place: apple
  || :match me: 
`;

const ast = parse(program);
const ctx = context(ast);
execute(ctx);

console.log("Stacks:");
for (const [name, values] of Object.entries(ctx.stacks)) {
  console.log(
    `:${name}: ${values.length === 0 ? "<empty>" : values.join(", ")}`,
  );
}
