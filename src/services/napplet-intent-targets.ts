import type { IntentDelivery, IntentDispatchParams, IntentTargetAcceptance } from "@kehto/services";

/** How long an accepted intent waits for its target napplet to load before it is dropped */
const DELIVERY_TIMEOUT = 60_000;

type PendingDelivery = {
  delivery: IntentDelivery;
  resolve: () => void;
};

/**
 * Accepted intents that have not reached their target yet, keyed by the target's catalog id.
 * Kept independently of the source napplet so delivery survives it being closed.
 */
const pending = new Map<string, PendingDelivery[]>();

/** Loaded napplet frames that can receive deliveries, keyed by catalog id */
const targets = new Map<string, Window>();

let openTarget: ((catalogId: string) => boolean) | null = null;

/** Sets how the shell brings an intent's target napplet on screen; returns false when it cannot */
export function setIntentTargetOpener(open: ((catalogId: string) => boolean) | null) {
  openTarget = open;
}

function post(target: Window, item: PendingDelivery) {
  target.postMessage({ type: "intent.deliver", delivery: item.delivery }, "*");
  item.resolve();
}

function drain(catalogId: string) {
  const target = targets.get(catalogId);
  const queue = pending.get(catalogId);
  if (!target || !queue) return;

  pending.delete(catalogId);
  for (const item of queue) post(target, item);
}

/**
 * Marks a napplet frame as ready for deliveries once its document has loaded. The injected
 * binding buffers `intent.deliver` until the napplet registers `onDelivery`.
 */
export function attachIntentTarget(catalogId: string, target: Window) {
  targets.set(catalogId, target);
  drain(catalogId);

  return () => {
    if (targets.get(catalogId) === target) targets.delete(catalogId);
  };
}

/** Retains an accepted intent and opens its target, or delivers in place when the target is already loaded */
export function acceptIntent(params: IntentDispatchParams): IntentTargetAcceptance {
  const delivery: IntentDelivery = Object.freeze({
    sender: params.sender,
    archetype: params.archetype,
    action: params.action,
    convention: params.convention,
    ...(params.payload === undefined ? {} : { payload: params.payload }),
  });

  if (!targets.has(params.handler) && !openTarget?.(params.handler)) throw new Error("intent target cannot be opened");

  const completion = new Promise<void>((resolve, reject) => {
    const item: PendingDelivery = {
      delivery,
      resolve: () => {
        window.clearTimeout(timer);
        resolve();
      },
    };
    const timer = window.setTimeout(() => {
      const queue = pending.get(params.handler)?.filter((entry) => entry !== item);
      if (queue?.length) pending.set(params.handler, queue);
      else pending.delete(params.handler);
      reject(new Error("intent target did not load"));
    }, DELIVERY_TIMEOUT);

    pending.set(params.handler, [...(pending.get(params.handler) ?? []), item]);
  });

  drain(params.handler);
  return { completion };
}
