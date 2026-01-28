import {
  parse,
  createHost,
  prettyTuple,
  prettyStacks,
  matchesCause,
  parseRule,
  maybePopMatchingCause,
  sym,
} from "granary";

//
// jQuery in 2026
//
const $ = (window.$ = (s) => document.querySelectorAll(s));
const $1 = (window.$1 = (s) => document.querySelector(s));

let initialProgram = $1('script[type="application/granary"]')?.textContent;
if (initialProgram === undefined) {
  initialProgram = "";
  console.warn("No initial program found");
}

const host = createHost(initialProgram);

document.body.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.matches("[nv-onclick],[nv-onclick] *")) return;
  const source = target.getAttribute("nv-onclick")!;
  host.settleWith({ prepend: parse(source).rules });
});

host.onSettled((ctx) => {
  $("[nv-value]").forEach((el) => {
    const stack = el.getAttribute("nv-value")!;
    const value = ctx.stacks[stack] ?? [];
    const pretty = prettyTuple(value);
    if ("value" in el) el.value = pretty;
    else el.setAttribute("value", pretty);
  });
});
host.onStepped((ctx) => {
  const additionCause = parseRule(
    "|:@host step: $operation $n $preposition $stackName|",
  ).causes[0]!;
  if (matchesCause(ctx, additionCause)) {
    maybePopMatchingCause(ctx, additionCause);
    const n = ctx.variableAssignments["n"];
    const stackName = ctx.variableAssignments["stackName"]!.value;
    const operation = ctx.variableAssignments["operation"]!.value;
    if (typeof operation !== "string") {
      console.error("Expected string operation but got:", operation);
      throw new Error("Operation was not a string, see console");
    }
    if (typeof stackName !== "string") {
      console.error("Expected string stackName but got:", stackName);
      throw new Error("Stack name was not a string, see console");
    }
    const popped = ctx.stacks[stackName]?.pop();
    if (!popped)
      throw new Error(`Unexpected empty or non-existant stack '${stackName}'`);
    const poppedValue = Number(popped.value);
    if (Number.isNaN(poppedValue))
      throw new Error(
        `Unable to parse value '${popped.value}' on top of stack '${stackName}' as Number`,
      );
    const nValue = Number(n!.value);
    if (Number.isNaN(nValue))
      throw new Error(
        `Unable to parse value '${n}' on stack '${additionCause.stack}'`,
      );
    let result = poppedValue;
    if (operation == "add") result += nValue;
    else if (operation == "subtract") result -= nValue;
    else if (operation == "multiply") result *= nValue;
    else if (operation == "divide") result /= nValue;
    else if (operation == "mod") result %= nValue;
    else throw new Error(`Unknown operation '${operation}'`);
    ctx.stacks[stackName]!.push(sym(String(result)));
  }
  console.log("Stacks:");
  console.log(prettyStacks(ctx.stacks));
});
host.settle();
