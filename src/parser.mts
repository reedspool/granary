export type Pattern = {
  stack: string;
  symbols: string;
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
    | "reading_symbols" = "find_outer_delimiter";
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
    symbols: "",
    modified: false,
  };

  const finishCurrentPattern = () => {
    if (!currentPattern.modified) return;

    const target =
      subState === "reading_cause" ? currentRule.causes : currentRule.effects;

    target.push({
      stack: currentPattern.stack.trim(),
      symbols: currentPattern.symbols.trim(),
    });
    currentRule.modified = true;

    currentPattern = {
      stack: "",
      symbols: "",
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
      finishCurrentPattern();
      finishCurrentRule();
      return ast;
    }
    if (state === "find_outer_delimiter") {
      if (/\S/.test(char)) {
        outer_delimiter = char;
        state = "find_inner_delimiter";
      }
    } else if (state === "find_inner_delimiter") {
      if (outer_delimiter === char) {
        finishCurrentPattern();
        if (subState === "reading_cause") {
          subState = "reading_effect";
        } else if (subState === "reading_effect") {
          subState = "reading_cause";
        }
      } else if (/\S/.test(char)) {
        inner_delimiter = char;
        state = "reading_stack_name";
      }
    } else if (state === "reading_stack_name") {
      if (inner_delimiter === char) {
        state = "reading_symbols";
      } else {
        currentPattern.stack += char;
        currentPattern.modified = true;
      }
    } else if (state === "reading_symbols") {
      if (outer_delimiter === char) {
        finishCurrentPattern();
        if (subState === "reading_cause") {
          subState = "reading_effect";
        } else if (subState === "reading_effect") {
          finishCurrentRule();
          subState = "reading_cause";
        }
        state = "find_inner_delimiter";
      } else if (inner_delimiter === char) {
        finishCurrentPattern();
        state = "reading_stack_name";
      } else {
        currentPattern.symbols += char;
        currentPattern.modified = true;
      }
    }
    index++;
  }
};
