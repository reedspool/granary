import { type AST, type Rule, type Pattern } from "./parser.mts";

export type Tuple = Array<string>;
export type Stack = Array<Tuple>;

export type Context = {
  ast: AST;
  stacks: Record<string, Stack>;
  initialized: boolean;
};

export const context: (ast: AST) => Context = (ast) => {
  return {
    ast,
    stacks: {},
    initialized: false,
  };
};

export const fulfillEffect: (ctx: Context, effect: Pattern) => void = (
  { stacks },
  { stack, symbols },
) => {
  if (!stacks[stack]) stacks[stack] = [];
  stacks[stack].push([symbols]);
};

export const matchesCause: (ctx: Context, cause: Pattern) => boolean = (
  { stacks },
  { stack, symbols },
) => {
  const top = stacks[stack]?.at(-1)?.at(0);
  if (top === undefined) return false;
  return top === symbols;
};

export const execute: (ctx: Context) => void = (ctx) => {
  let endlessLoopTracker = 0;
  while (endlessLoopTracker++ < 10_000) {
    // First, distinct pass which matches only all empty causes
    if (!ctx.initialized) {
      for (const rule of ctx.ast.rules) {
        if (rule.causes.length === 0) {
          for (const effect of rule.effects) {
            fulfillEffect(ctx, effect);
          }
        }
      }
      ctx.initialized = true;
      return;
    } else {
      // Main loop. Search for a matching cause
      let matchingRule: Rule | null = null;
      rules: for (const rule of ctx.ast.rules) {
        causes: for (const cause of rule.causes) {
          if (!matchesCause(ctx, cause)) continue rules;
        }
        matchingRule = rule;
        break rules; // be gay do crime
      }

      // No matching rule, settled
      if (matchingRule === null) return;

      for (const effect of matchingRule.effects) {
        fulfillEffect(ctx, effect);
      }

      // Go again
    }
  }
  throw new Error("Endless loop tripwire hit");
};
