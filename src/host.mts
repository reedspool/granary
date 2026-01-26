import { context, fullfillInitializers, step, type Context } from "./core.mts";
import { parse, type Rule } from "./parser.mts";

// Not sure if you'll ever want the full rule, since theoretically you matched on the causes already.
export type MatchingRuleCallback = (ctx: Context) => void;

export const createHost = (ctxOrSource: Context | string) =>
  new Host(
    typeof ctxOrSource === "string" ? context(parse(ctxOrSource)) : ctxOrSource,
  );

export class Host extends EventTarget {
  ctx: Context;
  hostStepCompletedEventName = "host step completed";
  hostSettledEventName = "host settled completed";

  constructor(ctx: Context) {
    super();
    this.ctx = ctx;
  }

  step() {
    const matchedAnything = step(this.ctx);
    this.dispatchEvent(new Event(this.hostStepCompletedEventName));
    if (!matchedAnything)
      this.dispatchEvent(new Event(this.hostSettledEventName));
    return matchedAnything;
  }

  settle() {
    // This is basically core's settle() except it calls my step instead of
    // core's step() to dispatch events
    let endlessLoopTracker = 0;
    while (endlessLoopTracker++ < 10_000) {
      if (!this.step()) return;
    }
    throw new Error("Infinite loop tripwire hit");
  }

  // Like settle, but with differences just for this run which are cleaned up
  // afterwards. Also runs any initializers in the given rules.
  settleWith({
    prepend,
    append,
  }: { prepend?: Array<Rule>; append?: Array<Rule> } = {}) {
    const rules = this.ctx.ast.rules;

    if (prepend) {
      rules.unshift(...prepend);
      fullfillInitializers(this.ctx, prepend);
    }

    if (append) {
      rules.push(...append);
      fullfillInitializers(this.ctx, append);
    }

    this.settle();

    rules.splice(0, prepend?.length ?? 0);
    const numAppended = append?.length ?? 0;
    rules.splice(-1 * numAppended, numAppended);
  }

  onStepped(callback: MatchingRuleCallback) {
    this.addEventListener(this.hostStepCompletedEventName, () =>
      callback.call(this, this.ctx),
    );
  }

  onSettled(callback: MatchingRuleCallback) {
    this.addEventListener(this.hostSettledEventName, () =>
      callback.call(this, this.ctx),
    );
  }
}
