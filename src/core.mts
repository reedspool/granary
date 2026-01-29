import {
  type AST,
  type Rule,
  type Pattern,
  type Symbol,
  hostSym,
} from "./parser.mts";

export type Tuple = Array<Symbol>;
export type Stack = Tuple;

export type Context = {
  ast: AST;
  stacks: Record<string, Stack>;
  initialized: boolean;
  variableAssignments: Record<string, Symbol>;
};

export const context: (ast: AST) => Context = (ast) => {
  return {
    ast,
    stacks: {},
    initialized: false,
    variableAssignments: {},
  };
};

export const fulfillEffect: (ctx: Context, effect: Pattern) => void = (
  ctx,
  { stack, symbols },
) => {
  const { stacks, variableAssignments } = ctx;
  if (!stacks[stack]) stacks[stack] = [];
  stacks[stack].push(
    ...symbols.map((s) => {
      if (s.type === "variable") {
        const assigned = variableAssignments[s.value];
        if (!assigned)
          throw new Error("Unexpected variable '${s.value}' had no assignment");
        return assigned;
      } else if (s.type === "hostExpression") {
        return hostSym(evaluateHostExpression(ctx, s.value));
      }
      return s;
    }),
  );
};

export const maybePopMatchingCause: (ctx: Context, cause: Pattern) => void = (
  ctx,
  { stack, symbols, keep },
) => {
  if (!ctx.stacks[stack])
    throw new Error(`Unexpected missing stack '${stack}'`);
  if (ctx.stacks[stack].length < symbols.length)
    throw new Error(
      `Unexpected stack '${stack}' had fewer items than matched symbols`,
    );
  if (keep) return;
  symbols.forEach(() => pop(ctx, stack));
};

export const matchesCause: (ctx: Context, cause: Pattern) => boolean = (
  { stacks, variableAssignments },
  { stack, symbols },
) => {
  if (!stacks[stack]) return false;
  if (stacks[stack].length == 0) return false;
  for (let index = 1; index <= symbols.length; index++) {
    const symbolOnStack = stacks[stack].at(-index);
    const givenSymbol = symbols.at(-index);
    if (!symbolOnStack) return false;
    if (!givenSymbol) throw new Error("Unexpected undefined given symbol");
    if (symbolOnStack.type === "variable")
      throw new Error("Unexpected variable on stack");
    if (givenSymbol.type === "variable") {
      if (!variableAssignments[givenSymbol.value]) {
        variableAssignments[givenSymbol.value] = symbolOnStack;
      } else {
        if (
          variableAssignments[givenSymbol.value]!.value !== symbolOnStack.value
        )
          return false;
      }
    } else {
      if (symbolOnStack.value !== givenSymbol.value) return false;
    }
  }
  return true;
};

export const findMatchingRule: (ctx: Context) => Rule | null = (ctx) => {
  rules: for (const rule of ctx.ast.rules) {
    ctx.variableAssignments = {}; // Reset for each rule
    // No causes only matches during initialization
    if (rule.causes.length === 0) continue rules;
    for (const cause of rule.causes) {
      if (!matchesCause(ctx, cause)) continue rules;
    }
    return rule;
  }

  return null;
};

// Performs initializers (rules with empty causes). Returns true if it did any
// Runs on the given rules, not the `ctx.ast.rules` to usable with ephemeral
// rule sets
export const fullfillInitializers: (
  ctx: Context,
  rules: Array<Rule>,
) => boolean = (ctx, rules) => {
  let matched = false;
  for (const rule of rules) {
    if (rule.causes.length === 0) {
      for (const effect of rule.effects) {
        matched = true;
        fulfillEffect(ctx, effect);
      }
    }
  }
  return matched;
};

// Returns true if a rule matched, false if not
export const step: (ctx: Context) => boolean = (ctx) => {
  // First, distinct pass which matches only all empty causes
  if (!ctx.initialized) {
    fullfillInitializers(ctx, ctx.ast.rules);
    ctx.initialized = true;
    return true;
  }

  // Main loop. Search for a matching cause
  const matchingRule = findMatchingRule(ctx);

  // No matching rule, settled
  if (matchingRule === null) return false;

  for (const cause of matchingRule.causes) {
    maybePopMatchingCause(ctx, cause);
  }

  for (const effect of matchingRule.effects) {
    fulfillEffect(ctx, effect);
  }

  return true;
};

export const settle: (ctx: Context) => void = (ctx) => {
  let endlessLoopTracker = 0;
  while (endlessLoopTracker++ < 10_000) {
    if (!step(ctx)) return;
  }
  throw new Error("Infinite loop tripwire hit");
};

export const evaluateHostExpression: (
  ctx: Context,
  expression: string,
) => unknown = (ctx, expression) => {
  const args: Array<string> = [];
  const values: Array<unknown> = [];

  Object.entries(ctx.variableAssignments).forEach(([key, symbol]) => {
    args.push("$" + key);
    values.push(symbol.value);
  });

  const fn = new Function(...args, `return (() => ${expression})()`);

  return fn(...values);
};

export const push: (ctx: Context, stack: string, symbol: Symbol) => void = (
  ctx,
  stack,
  symbol,
) => {
  ctx.stacks[stack] ??= [];
  ctx.stacks[stack].push(symbol);
};

export const pop: (ctx: Context, stack: string) => Symbol | undefined = (
  ctx,
  stack,
) => {
  const popped = ctx.stacks[stack]?.pop();
  if (ctx.stacks[stack]?.length === 0) delete ctx.stacks[stack];
  return popped;
};
