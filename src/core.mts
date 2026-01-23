import {
  type AST,
  type Rule,
  type Pattern,
  type Symbol,
  sym,
} from "./parser.mts";

export type Tuple = Array<Symbol>;
export type Stack = Array<Tuple>;

export type Context = {
  ast: AST;
  stacks: Record<string, Stack>;
  initialized: boolean;
  variableValuesByName: Record<string, string>;
};

export const context: (ast: AST) => Context = (ast) => {
  return {
    ast,
    stacks: {},
    initialized: false,
    variableValuesByName: {},
  };
};

export const fulfillEffect: (ctx: Context, effect: Pattern) => void = (
  { stacks, variableValuesByName },
  { stack, symbols },
) => {
  if (!stacks[stack]) stacks[stack] = [];
  stacks[stack].push(
    symbols.map((s) =>
      s.type === "simple" ? s : sym(variableValuesByName[s.value]),
    ),
  );
};

export const maybePopMatchingCause: (ctx: Context, cause: Pattern) => void = (
  { stacks },
  { stack, keep },
) => {
  if (!stacks[stack]) throw new Error(`Unexpected missing stack '${stack}'`);
  if (keep) return;
  stacks[stack].pop();
};

export const matchesCause: (ctx: Context, cause: Pattern) => boolean = (
  { stacks, variableValuesByName },
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
    if (givenSymbol.type === "variable") {
      if (!variableValuesByName[givenSymbol.value]) {
        variableValuesByName[givenSymbol.value] = symbolOnStack.value;
      } else {
        if (variableValuesByName[givenSymbol.value] !== symbolOnStack.value)
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
    ctx.variableValuesByName = {}; // Reset for each rule
    // No causes only matches during initialization
    if (rule.causes.length === 0) continue rules;
    for (const cause of rule.causes) {
      if (!matchesCause(ctx, cause)) continue rules;
    }
    return rule;
  }

  return null;
};

// Returns true if a rule matched, false if not
export const step: (ctx: Context) => boolean = (ctx) => {
  // First, distinct pass which matches only all empty causes
  if (!ctx.initialized) {
    let matched = false;
    for (const rule of ctx.ast.rules) {
      if (rule.causes.length === 0) {
        for (const effect of rule.effects) {
          matched = true;
          fulfillEffect(ctx, effect);
        }
      }
    }
    ctx.initialized = true;
    return matched;
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
