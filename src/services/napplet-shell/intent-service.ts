import {
  createIntentService,
  type IntentAvailability,
  type IntentCandidate,
  type IntentRequest,
  type IntentResult,
} from "@kehto/services";

import { conventionId, type NappletIntent } from "../../helpers/nostr/napplets";
import {
  getDefaultIntentHandler,
  getInstalledNapplets,
  getInstalledNappletsForIntent,
  type InstalledNapplet,
} from "../installed-napplets";

function asIntentPayload(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};

  const payload: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "string") payload[key] = item;
  }
  return payload;
}

function installedHandlersFor(archetype: string) {
  return getInstalledNapplets().flatMap((napplet) => {
    const entry = napplet.archetypes.find((item) => item.name === archetype);
    return entry ? [{ napplet, entry }] : [];
  });
}

function candidateFor(handler: ReturnType<typeof installedHandlersFor>[number], action?: string): IntentCandidate {
  const conventions = handler.entry.protocols.length
    ? handler.entry.protocols
    : handler.entry.actions.map((action) => conventionId(handler.entry.name, action));

  return {
    dTag: handler.napplet.address,
    title: handler.napplet.title,
    actions: handler.entry.actions,
    conventions,
    isDefault: getDefaultIntentHandler(handler.entry.name, action)?.address === handler.napplet.address,
  };
}

function availabilityFor(archetype: string): IntentAvailability {
  const handlers = installedHandlersFor(archetype);
  return {
    archetype,
    available: handlers.length > 0,
    candidates: handlers.map((handler) => candidateFor(handler)),
    hasDefault: handlers.some((handler) => !!getDefaultIntentHandler(archetype, handler.entry.actions[0])),
  };
}

function failed(archetype: string, action: string, error: string): IntentResult {
  return { ok: false, archetype, action, handled: false, error };
}

function handlerMatchesPreference(napplet: InstalledNapplet, preference: string) {
  return preference === napplet.address;
}

export function createNappletIntentService(options: {
  navigate: () => ((intent: NappletIntent, handler: InstalledNapplet) => void) | null;
  chooseHandler: (intent: NappletIntent) => Promise<InstalledNapplet | undefined>;
}) {
  return createIntentService({
    resolver: {
      available: (archetype) => availabilityFor(archetype),

      handlers: () => {
        const archetypes = new Set<string>();
        for (const napplet of getInstalledNapplets()) {
          for (const archetype of napplet.archetypes) archetypes.add(archetype.name);
        }
        return Array.from(archetypes).map(availabilityFor);
      },

      invoke: async (request: IntentRequest) => {
        const { archetype } = request;
        const action = request.action ?? "open";
        const handlers = installedHandlersFor(archetype).filter((handler) => handler.entry.actions.includes(action));
        const payload = asIntentPayload(request.payload);

        if (handlers.length === 0) {
          const handler = await options.chooseHandler({ archetype, action, payload });
          if (!handler) return failed(archetype, action, "no napplet selected");

          const navigate = options.navigate();
          if (!navigate) return failed(archetype, action, "napplet frame is not available");

          window.setTimeout(() => navigate({ archetype, action, payload }, handler), 0);

          return {
            ok: true,
            archetype,
            action,
            handled: true,
            handler: handler.address,
            windowId: `napplet:${handler.address}`,
            convention: request.convention ?? conventionId(archetype, action),
          };
        }

        const preference = request.handler;
        const defaultHandler = getDefaultIntentHandler(archetype, action);
        const installedIntentHandlers = getInstalledNappletsForIntent(archetype, action);
        const handler =
          typeof preference === "string" && preference !== "default" && preference !== "choose"
            ? handlers.find((item) => handlerMatchesPreference(item.napplet, preference))
            : defaultHandler
              ? handlers.find((item) => item.napplet.address === defaultHandler.address)
              : installedIntentHandlers.length > 0
                ? handlers.find((item) => item.napplet.address === installedIntentHandlers[0].address)
                : handlers[0];
        if (!handler) return failed(archetype, action, `${preference} does not handle ${archetype}`);

        const conventions = handler.entry.protocols.length
          ? handler.entry.protocols
          : handler.entry.actions.map((item) => conventionId(archetype, item));
        if (request.convention && !conventions.includes(request.convention)) {
          return failed(archetype, action, `unsupported convention ${request.convention}`);
        }

        const navigate = options.navigate();
        if (!navigate) return failed(archetype, action, "napplet frame is not available");

        const intent = { archetype, action, payload };
        window.setTimeout(() => navigate(intent, handler.napplet), 0);

        return {
          ok: true,
          archetype,
          action,
          handled: true,
          handler: handler.napplet.address,
          windowId: `napplet:${handler.napplet.address}`,
          convention: request.convention ?? conventions[0],
        };
      },
    },
  });
}
