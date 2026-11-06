import {
  createCatalogIntentResolver,
  createIntentService,
  manifestToIntentCatalogEntry,
  type IntentCandidate,
  type IntentCatalogEntry,
  type IntentHandlerHint,
  type CatalogIntentResolver,
  type IntentRequest,
} from "@kehto/services";
import type { NostrEvent } from "nostr-tools";

import { getNappletAddressCatalogId, getNappletCatalogId, getNappletArchetypes } from "../../helpers/nostr/napplets";
import { getDefaultIntentHandler, getInstalledNapplets, type InstalledNapplet } from "../installed-napplets";
import { acceptIntent } from "../napplet-intent-targets";
import { handlerPreferences$, handlerManifests$ } from "../handler-preference-state";
import { handlerReference, preferredHandlerReferences } from "../../helpers/nostr/handler-preferences";

/** Asks the user to pick one of the compatible handlers; resolves to its catalog id, or undefined when cancelled */
export type IntentHandlerChooser = (
  archetype: string,
  candidates: readonly IntentCandidate[],
) => Promise<string | undefined>;

function toCatalogEntry(napplet: InstalledNapplet): IntentCatalogEntry[] {
  const catalogId = getNappletAddressCatalogId(napplet.address);
  if (!catalogId) return [];

  return [
    manifestToIntentCatalogEntry({
      catalogId,
      title: napplet.title,
      archetypes: napplet.archetypes.flatMap((archetype) =>
        archetype.contracts.map(({ convention, params }) => ({ slug: archetype.name, convention, params })),
      ),
    }),
  ];
}

/** Maps a `35129:<pubkey>:<d>` handler hint to the catalog id it would have once installed */
function hintCatalogId(hint: IntentHandlerHint) {
  const [kind, pubkey, ...identifier] = hint.address.split(":");
  try {
    return getNappletCatalogId({ id: "", kind: Number(kind), pubkey, tags: [["d", identifier.join(":")]] });
  } catch {
    return undefined;
  }
}

export function createNappletIntentService(options: {
  chooseHandler: IntentHandlerChooser;
  resolveSender: (windowId: string) => string | undefined;
  isHandlerAllowed?: (manifest: NostrEvent) => boolean;
}) {
  const baseOptions = {
    loadCatalog: () => getInstalledNapplets().flatMap(toCatalogEntry),
    targets: { accept: acceptIntent },
    getDefaultHandler: (archetype: string) => {
      if (handlerPreferences$.value.has(archetype)) return undefined;
      const handler = getDefaultIntentHandler(archetype);
      return handler && getNappletAddressCatalogId(handler.address);
    },
    chooseHandler: (archetype: string, candidates: readonly IntentCandidate[]) =>
      options.chooseHandler(archetype, candidates),
    // A napplet may only address a specific handler the user picked as default or confirms now
    authorizeExplicitHandler: async (
      _sender: string,
      handler: string,
      request: IntentRequest,
      candidate: IntentCandidate,
    ) => candidate.isDefault || (await options.chooseHandler(request.archetype, [candidate])) === handler,
    resolveHandlerHint: (hint: IntentHandlerHint, candidates: readonly IntentCandidate[]) => {
      const id = hintCatalogId(hint);
      return candidates.find((candidate) => candidate.id === id)?.id;
    },
  };
  const base = createCatalogIntentResolver(baseOptions);
  // One resolver per invocation keeps concurrent intents from sharing mutable scope.
  const resolver: CatalogIntentResolver = {
    ...base,
    invoke: (request, context) => {
      const preference = handlerPreferences$.value.get(request.archetype);
      if (!preference || request.handler) return base.invoke(request, context);
      const installed = getInstalledNapplets();
      const manifests = handlerManifests$.value;
      const compatible = installed.filter((app) => {
        const reference = handlerReference(app.address);
        const manifest = reference && manifests.get(reference);
        return (
          manifest &&
          (!options.isHandlerAllowed || options.isHandlerAllowed(manifest)) &&
          getNappletArchetypes(manifest).some(
            (role) =>
              role.name === request.archetype &&
              role.contracts.some((contract) => contract.convention === request.convention),
          )
        );
      });
      const references = preferredHandlerReferences(preference, request.convention, (reference) =>
        compatible.some((app) => handlerReference(app.address) === reference),
      );
      const candidates = references.length
        ? installed.filter((app) => references.includes(handlerReference(app.address) ?? ""))
        : installed;
      return createCatalogIntentResolver({
        ...baseOptions,
        targets: {
          accept: (params) => {
            const app = getInstalledNapplets().find(
              (item) => getNappletAddressCatalogId(item.address) === params.handler,
            );
            const reference = app && handlerReference(app.address);
            const manifest = reference ? handlerManifests$.value.get(reference) : undefined;
            if (
              handlerPreferences$.value.get(request.archetype) !== preference ||
              !app ||
              (reference && manifest?.id !== manifests.get(reference)?.id) ||
              (manifest && options.isHandlerAllowed && !options.isHandlerAllowed(manifest))
            )
              throw new Error("Handler preferences or permissions changed");
            return acceptIntent(params);
          },
        },
        loadCatalog: () =>
          candidates.flatMap((app) => {
            const manifest = manifests.get(handlerReference(app.address) ?? "");
            return toCatalogEntry(manifest ? { ...app, archetypes: getNappletArchetypes(manifest) } : app);
          }),
        getDefaultHandler: () => undefined,
      }).invoke(request, context);
    },
  };

  return {
    resolver,
    service: createIntentService({ resolver, resolveSender: options.resolveSender }),
  };
}
