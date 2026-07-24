import { intentTopic, readyTopic, type NappletIntent } from "../helpers/nostr/napplets";

export type NappletIntentDelivery = {
  seed: (intent: NappletIntent) => void;
  redeliver: (intent: NappletIntent) => void;
  observeReady: (event: MessageEvent) => boolean;
  dispose: () => void;
};

type IncEmitMessage = { type?: unknown; topic?: unknown };

function toCloneablePayload(payload: Record<string, unknown>): Record<string, string> {
  const plain: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") plain[key] = value;
  }
  return plain;
}

export function createNappletIntentDelivery(options: { getTarget: () => Window | null }): NappletIntentDelivery {
  let pending: NappletIntent | null = null;
  let ready = false;
  let delivered = false;
  let archetype = "";

  function flush() {
    if (delivered || !ready || !pending) return;

    const target = options.getTarget();
    if (!target) return;

    target.postMessage(
      {
        type: "inc.event",
        topic: intentTopic(pending.archetype, pending.action),
        payload: toCloneablePayload(pending.payload),
        sender: "shell",
      },
      "*",
    );

    delivered = true;
    pending = null;
  }

  function arm(intent: NappletIntent) {
    pending = intent;
    archetype = intent.archetype;
    delivered = false;
    flush();
  }

  return {
    seed: arm,
    redeliver: arm,
    observeReady(event) {
      const target = options.getTarget();
      if (!target || event.source !== target) return false;

      const data = event.data as IncEmitMessage | null;
      if (!data || typeof data !== "object" || data.type !== "inc.emit") return false;
      if (!archetype || data.topic !== readyTopic(archetype)) return false;

      ready = true;
      flush();
      return true;
    },
    dispose() {
      pending = null;
      archetype = "";
      ready = false;
      delivered = false;
    },
  };
}
