export type SimpleSymbol =
  | { type: "simple"; value: string }
  | {
      type: "variable";
      value: string;
    }
  | { type: "hostExpression"; value: string };
export type HostValueSymbol = { type: "hostValue"; value: unknown };
export type Symbol = SimpleSymbol | HostValueSymbol;
export const simpleSymbolTypes = ["simple", "variable", "hostExpression"];

export const isSimpleSymbol = (symbol: Symbol): symbol is SimpleSymbol => {
  return simpleSymbolTypes.includes(symbol.type);
};

export const sym: (
  value?: string,
  type?: SimpleSymbol["type"],
) => SimpleSymbol = (value = "", type = "simple") => ({
  value,
  type,
});

export const hostSym: (value?: unknown) => HostValueSymbol = (
  value = undefined,
) => ({ value, type: "hostValue" });

export type Pattern = {
  stack: string;
  symbols: Array<Symbol>;
  keep?: boolean;
};

export const pattern: (
  stack?: string,
  symbols?: Pattern["symbols"],
) => Pattern = (stack = "", symbols = []) => ({ stack, symbols });

export type Rule = {
  causes: Array<Pattern>;
  effects: Array<Pattern>;
};

export const rule: () => Rule = () => ({ causes: [], effects: [] });

export type AST = {
  rules: Array<Rule>;
};

const bracketMatches = {
  '"': '"',
  "'": "'",
  "`": "`",
  "(": ")",
  "{": "}",
  "[": "]",
};

export const parse: (
  source: string,
  options?: { stopAfterSingleRule?: boolean },
) => AST = (source, options) => {
  const ast: AST = { rules: [] };
  let index = 0;
  let state:
    | "find_outer_delimiter"
    | "find_inner_delimiter"
    | "reading_stack_name"
    | "find_symbol"
    | "read_symbol"
    | "read_expression" = "find_outer_delimiter";
  let subState: "reading_cause" | "reading_effect" = "reading_cause";
  let outer_delimiter: string | null = null;
  let inner_delimiter: string | null = null;
  let currentRule: Rule & { modified?: boolean } = rule();
  let currentPattern: Pattern & { modified?: boolean } = pattern();
  let currentSymbol: SimpleSymbol & {
    includeSpaces?: boolean;
    store?: boolean;
  } = sym();
  let escapeNextCharacter = false;
  const bracketStack: Array<keyof typeof bracketMatches> = [];

  const finishCurrentSymbol = () => {
    if (!currentSymbol.store) return;
    let symbol: Symbol;
    if (isSimpleSymbol(currentSymbol)) {
      symbol = sym(currentSymbol.value, currentSymbol.type);
      if (
        currentSymbol.type === "simple" &&
        currentSymbol.value.startsWith("$")
      ) {
        symbol.value = symbol.value.slice(1);
        symbol.type = "variable";
      }
      if (currentSymbol.type === "hostExpression") {
        symbol.value = symbol.value.trim();
      }
    } else {
      throw new Error("parsing advanced symbols not implemented");
    }
    currentPattern.symbols.push(symbol);
    currentPattern.modified = true;
    currentSymbol = sym();
  };
  const finishCurrentPattern = () => {
    if (!currentPattern.modified) return;

    const newPattern: Pattern = {
      stack: currentPattern.stack.trim(),
      symbols: currentPattern.symbols,
    };

    if (newPattern.symbols.length === 0) {
      newPattern.symbols.push(sym(""));
    }

    if (subState === "reading_cause") {
      const last = newPattern.symbols.at(-1);
      if (last && isSimpleSymbol(last) && last.value.at(-1) === "?") {
        last.value = last.value.slice(0, -1);
        newPattern.keep = true;
      }
    }

    const target =
      subState === "reading_cause" ? currentRule.causes : currentRule.effects;
    target.push(newPattern);
    currentRule.modified = true;

    currentPattern = pattern();
  };
  const finishCurrentRule = () => {
    if (!currentRule.modified) return;
    const newRule = rule();
    newRule.causes = currentRule.causes;
    newRule.effects = currentRule.effects;
    ast.rules.push(newRule);
    currentRule = rule();
  };
  while (true) {
    const char = source.at(index);
    if (!char) {
      finishCurrentSymbol();
      finishCurrentPattern();
      finishCurrentRule();
      return ast;
    }
    if (state === "find_outer_delimiter") {
      if (/\S/.test(char)) {
        outer_delimiter = char;
        state = "find_inner_delimiter";
        currentRule.modified = true;
      }
    } else if (state === "find_inner_delimiter") {
      if (outer_delimiter === char) {
        finishCurrentPattern();
        if (subState === "reading_cause") {
          subState = "reading_effect";
        } else if (subState === "reading_effect") {
          subState = "reading_cause";
          finishCurrentRule();
          currentRule.modified = true;
        }
      } else if (/\S/.test(char)) {
        inner_delimiter = char;
        state = "reading_stack_name";
        currentPattern.modified = true;
      }
    } else if (state === "reading_stack_name") {
      if (inner_delimiter === char) {
        state = "find_symbol";
      } else {
        currentPattern.stack += char;
        currentPattern.modified = true;
      }
    } else if (state === "find_symbol" || state === "read_symbol") {
      if (outer_delimiter === char) {
        finishCurrentSymbol();
        finishCurrentPattern();
        if (subState === "reading_cause") {
          subState = "reading_effect";
        } else if (subState === "reading_effect") {
          finishCurrentRule();

          if (options?.stopAfterSingleRule) {
            return ast;
          }
          currentRule.modified = true;
          subState = "reading_cause";
        }
        state = "find_inner_delimiter";
      } else if (inner_delimiter === char) {
        finishCurrentSymbol();
        finishCurrentPattern();
        state = "reading_stack_name";
      } else if ("{" === char) {
        finishCurrentSymbol();
        state = "read_expression";
        currentSymbol.type = "hostExpression";
      } else if (state === "find_symbol") {
        if (/\s/.test(char)) {
          // Do nothing
        } else if ("[" === char) {
          state = "read_symbol";
          currentSymbol.includeSpaces = true;
        } else {
          state = "read_symbol";
          currentSymbol.value += char;
          currentSymbol.store = true;
        }
      } else if (state === "read_symbol") {
        if (/\s/.test(char) && !currentSymbol.includeSpaces) {
          finishCurrentSymbol();
          state = "find_symbol";
        } else if ("]" === char && currentSymbol.includeSpaces) {
          finishCurrentSymbol();
          state = "find_symbol";
        } else {
          currentSymbol.value += char;
          currentSymbol.store = true;
        }
      }
    } else if (state === "read_expression") {
      if (escapeNextCharacter) {
        escapeNextCharacter = false;
        currentSymbol.value += char;
        currentSymbol.store = true;
      } else if ("\\" === char) {
        escapeNextCharacter = true;
        currentSymbol.value += char;
        currentSymbol.store = true;
      } else if (
        bracketStack.length > 0 &&
        bracketMatches[bracketStack.at(-1)!] === char
      ) {
        bracketStack.pop();
        currentSymbol.value += char;
        currentSymbol.store = true;
      } else if (char in bracketMatches) {
        bracketStack.push(char as keyof typeof bracketMatches);
        currentSymbol.value += char;
        currentSymbol.store = true;
      } else if (bracketStack.length === 0 && "}" === char) {
        finishCurrentSymbol();
        state = "find_symbol";
      } else {
        currentSymbol.value += char;
        currentSymbol.store = true;
      }
    }
    index++;
  }
};

export const parseRule: (source: string) => Rule = (source) => {
  const ast = parse(source, { stopAfterSingleRule: true });

  const rule = ast.rules[0];
  if (!rule) throw new Error(`Failed to parse a rule from '${source}'`);

  return rule;
};
