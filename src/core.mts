import { type AST, type Rule, type Pattern, type Symbol } from "./parser.mts";

export type Tuple = Array<Symbol>;
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
  stacks[stack].push(symbols);
};

// TODO: "Maybe" because will implement `?` keeping in the future
export const maybePopMatchingCause: (ctx: Context, cause: Pattern) => void = (
  { stacks },
  { stack },
) => {
  if (!stacks[stack]) throw new Error(`Unexpected missing stack '${stack}'`);
  stacks[stack].pop();
};

export const matchesCause: (ctx: Context, cause: Pattern) => boolean = (
  { stacks },
  { stack, symbols },
) => {
  const top = stacks[stack]?.at(-1);
  if (top === undefined) return false;
  if (top.length !== symbols.length) return false;
  for (let index = 0; index < top.length; index++) {
    const symbolOnStack = top.at(index);
    const givenSymbol = symbols.at(index);
    if (!symbolOnStack) throw new Error("Unexpected undefined symbol on stack");
    if (!givenSymbol) throw new Error("Unexpected undefined given symbol");
    if (symbolOnStack.type === "variable")
      throw new Error("Unexpected variable on stack");
    if (givenSymbol.type === "variable")
      throw new Error("Variables not yet implemented");
    if (symbolOnStack.value !== givenSymbol.value) return false;
  }
  return true;
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
    } else {
      // Main loop. Search for a matching cause
      let matchingRule: Rule | null = null;
      rules: for (const rule of ctx.ast.rules) {
        // No causes only matches during initialization
        if (rule.causes.length === 0) continue rules;
        for (const cause of rule.causes) {
          if (!matchesCause(ctx, cause)) continue rules;
        }
        matchingRule = rule;
        break rules; // be gay do crime
      }

      // No matching rule, settled
      if (matchingRule === null) return;

      for (const cause of matchingRule.causes) {
        maybePopMatchingCause(ctx, cause);
      }

      for (const effect of matchingRule.effects) {
        fulfillEffect(ctx, effect);
      }

      // Go again
    }
  }
  throw new Error("Infinite loop tripwire hit");
};
