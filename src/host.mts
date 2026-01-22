import { type Context } from "./core.mts";
import { prettyTuple } from "./pretty.mts";

const HOST_SETTLED_STACK = "@host settled";
export const evaluateHostSettled: (ctx: Context) => void = (ctx) => {
  const stack = ctx.stacks[HOST_SETTLED_STACK];
  if (!stack) return;
  for (const tuple of stack) {
    const command = tuple[0]?.value;
    if (command === "log") {
      console.log(prettyTuple(tuple.slice(1)));
    } else {
      console.warn(
        `:@host settled: didn't know how to process command '${prettyTuple(tuple)}'`,
      );
    }
  }
  stack.length = 0;
};
