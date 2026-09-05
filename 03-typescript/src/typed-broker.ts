// src/typed-broker.ts — ~20 lines that turn broker.call/emit into typed calls.
// Action names become a union you can autocomplete; params and results are checked.
import type { Context, ServiceBroker, CallingOptions } from "moleculer";
import type { Actions, Events, Meta } from "./contracts";

export type ActionName = keyof Actions;
export type ActionParams<N extends ActionName> = Actions[N]["params"];
export type ActionResult<N extends ActionName> = Actions[N]["result"];

/** A Context whose params/meta are the ones declared for `N` in contracts.ts. */
export type Ctx<N extends ActionName> = Context<ActionParams<N>, Meta>;

/** Same for event handlers: ctx.params is the event payload. */
export type EventCtx<E extends keyof Events> = Context<Events[E], Meta>;

/** Typed wrapper around broker.call / ctx.call. */
export function call<N extends ActionName>(
  caller: ServiceBroker | Context<unknown, Meta>,
  action: N,
  params: ActionParams<N>,
  opts?: CallingOptions,
): Promise<ActionResult<N>> {
  return caller.call<ActionResult<N>, ActionParams<N>>(action, params, opts);
}

/** Typed wrapper around ctx.emit. */
export function emit<E extends keyof Events>(ctx: Context<unknown, Meta>, event: E, payload: Events[E]) {
  return ctx.emit(event, payload);
}
