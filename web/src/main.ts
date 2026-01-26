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
    const value = ctx.stacks[stack]?.at(0) ?? [];
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
    const n = ctx.variableValuesByName["n"];
    const stackName = ctx.variableValuesByName["stackName"]!;
    const operation = ctx.variableValuesByName["operation"]!;
    const popped = ctx.stacks[stackName]!.pop();
    if (popped?.length !== 1)
      throw new Error(
        `Expected a single value on top of stack '${stackName}' but instead got '${popped ? prettyTuple(popped) : "undefined"}' `,
      );
    const poppedValue = Number(popped.at(0)!.value);
    if (Number.isNaN(poppedValue))
      throw new Error(
        `Unable to parse value '${popped.at(0)?.value}' on top of stack '${stackName}' as Number`,
      );
    const nValue = Number(n);
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
    ctx.stacks[stackName]!.push([sym(String(result))]);
  }
  console.log("Stacks:");
  console.log(prettyStacks(ctx.stacks));
});
host.settle();
