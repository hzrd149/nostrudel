import {
  createCatalogIntentResolver,
  createIntentService,
  type IntentCandidate,
  type CatalogIntentResolver,
  type IntentRequest,
} from "@kehto/services";
import type { NostrEvent } from "nostr-tools";

import { getNappletCatalogId } from "../../helpers/nostr/napplets";
import { isHandlerConvention } from "../../helpers/nostr/handler-preferences";
import { acceptIntent } from "../napplet-intent-targets";
import { handlerManifests$, handlerPreferences$, localHandlerPreferences$ } from "../handler-preference-state";
import {
  isNappletHandlerAllowed,
  nappletCatalogEntry,
  preferredNappletHandlers,
  supportsNappletIntent,
} from "../napplet-handlers";

/** Discovery may return a newly loaded manifest, without a prior catalog entry. */
export type IntentHandlerChooser = (
  request: IntentRequest,
  candidates: readonly IntentCandidate[],
) => Promise<string | undefined>;

export function createNappletIntentService(options: {
  chooseHandler: IntentHandlerChooser;
  resolveSender: (windowId: string) => string | undefined;
  isHandlerAllowed?: (manifest: NostrEvent) => boolean;
  prepare?: (archetype: string) => Promise<void>;
}) {
  const allowed = options.isHandlerAllowed ?? isNappletHandlerAllowed;
  const base = createCatalogIntentResolver({
    loadCatalog: () => [...handlerManifests$.value.values()].filter(allowed).map(nappletCatalogEntry),
    targets: { accept: acceptIntent },
  });
  const resolver: CatalogIntentResolver = {
    ...base,
    invoke: async (request, context) => {
      if (
        !isHandlerConvention(request.convention, request.archetype) ||
        request.convention !== `napplet:${request.archetype}/${request.action}`
      )
        return { ok: false, error: "invalid convention" };
      if (!context.sender) return { ok: false, error: "invoke rejected" };
      await options.prepare?.(request.archetype);
      const preferred = preferredNappletHandlers(request.archetype, request.convention, allowed);
      const explicit =
        request.handler && request.handler !== "default" && request.handler !== "choose" ? request.handler : undefined;
      let selected =
        request.handler !== "choose" &&
        preferred.length === 1 &&
        (!explicit || getNappletCatalogId(preferred[0]) === explicit)
          ? preferred[0]
          : undefined;
      if (!selected) {
        const candidates = (await base.available(request.archetype)).candidates.filter(
          (candidate) => candidate.conventions.includes(request.convention) && (!explicit || candidate.id === explicit),
        );
        const id = await options.chooseHandler(request, candidates);
        if (!id) return { ok: false, error: "user cancelled" };
        if (explicit && id !== explicit) return { ok: false, error: "invoke rejected" };
        selected = [...handlerManifests$.value.values()].find((event) => getNappletCatalogId(event) === id);
      }
      if (!selected || !allowed(selected) || !supportsNappletIntent(selected, request.archetype, request.convention))
        return { ok: false, error: "invoke rejected" };
      const manifest = selected;
      const preferences = handlerPreferences$.value;
      const local = localHandlerPreferences$.value;
      return createCatalogIntentResolver({
        loadCatalog: () => [nappletCatalogEntry(manifest)],
        targets: {
          accept: (params) => {
            if (
              preferences !== handlerPreferences$.value ||
              local !== localHandlerPreferences$.value ||
              !allowed(manifest) ||
              ![...handlerManifests$.value.values()].some((event) => event.id === manifest.id)
            )
              throw new Error("Handler preferences or permissions changed");
            return acceptIntent(params);
          },
        },
      }).invoke({ ...request, handler: "default", handlerHint: undefined }, context);
    },
  };
  return { resolver, service: createIntentService({ resolver, resolveSender: options.resolveSender }) };
}
