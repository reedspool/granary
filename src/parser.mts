export type Symbol =
  | { type: "simple"; value: string }
  | {
      type: "variable";
      value: string;
    };

export const sym: (value?: string, type?: Symbol["type"]) => Symbol = (
  value = "",
  type = "simple",
) => ({
  value,
  type,
});

export type Pattern = {
  stack: string;
  symbols: Array<Symbol>;
  keep?: boolean;
};
export type Rule = {
  causes: Array<Pattern>;
  effects: Array<Pattern>;
};
export type AST = {
  rules: Array<Rule>;
};

export const parse: (source: string) => AST = (source) => {
  const ast: AST = { rules: [] };
  let index = 0;
  let state:
    | "find_outer_delimiter"
    | "find_inner_delimiter"
    | "reading_stack_name"
    | "find_symbol"
    | "read_symbol" = "find_outer_delimiter";
  let subState: "reading_cause" | "reading_effect" = "reading_cause";
  let outer_delimiter: string | null = null;
  let inner_delimiter: string | null = null;
  let currentRule: Rule & { modified: boolean } = {
    causes: [],
    effects: [],
    modified: false,
  };
  let currentPattern: Pattern & { modified: boolean } = {
    stack: "",
    symbols: [],
    modified: false,
  };
  let currentSymbol: Symbol & {
    includeSpaces?: boolean;
    store?: boolean;
  } = sym();

  const finishCurrentSymbol = () => {
    if (!currentSymbol.store) return;
    const symbol = sym(currentSymbol.value);
    if (currentSymbol.value.startsWith("$")) {
      symbol.value = symbol.value.slice(1);
      symbol.type = "variable";
    }
    currentPattern.symbols.push(symbol);
    currentPattern.modified = true;
    currentSymbol = sym();
  };
  const finishCurrentPattern = () => {
    if (!currentPattern.modified) return;

    const target =
      subState === "reading_cause" ? currentRule.causes : currentRule.effects;

    const pattern: Pattern = {
      stack: currentPattern.stack.trim(),
      symbols: currentPattern.symbols,
    };
    if (subState === "reading_cause") {
      const last = pattern.symbols.at(-1);
      if (last?.value.at(-1) === "?") {
        last.value = last.value.slice(0, -1);
        pattern.keep = true;
      }
    }

    target.push(pattern);
    currentRule.modified = true;

    currentPattern = {
      stack: "",
      symbols: [],
      modified: false,
    };
  };
  const finishCurrentRule = () => {
    if (!currentRule.modified) return;
    ast.rules.push({
      causes: currentRule.causes,
      effects: currentRule.effects,
    });
    currentRule = {
      causes: [],
      effects: [],
      modified: false,
    };
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
      }
    } else if (state === "reading_stack_name") {
      if (inner_delimiter === char) {
        state = "find_symbol";
        currentSymbol.store = true;
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
          currentRule.modified = true;
          subState = "reading_cause";
        }
        state = "find_inner_delimiter";
      } else if (inner_delimiter === char) {
        finishCurrentSymbol();
        finishCurrentPattern();
        state = "reading_stack_name";
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
    }
    index++;
  }
};
