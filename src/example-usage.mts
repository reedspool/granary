import { parse, context, execute } from "./index.mts";

const program = `

  | :dolphin: $food :porpoise: $food | :answer: nope
  | :narwhal: $food :porpoise: $food | :answer: gotchya
  || :porpoise: cranberry
  || :narwhal: cranberry
  || :dolphin: butter
  
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
