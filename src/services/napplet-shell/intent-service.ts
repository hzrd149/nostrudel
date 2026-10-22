import {
  createCatalogIntentResolver,
  createIntentService,
  manifestToIntentCatalogEntry,
  type IntentCandidate,
  type IntentCatalogEntry,
  type IntentHandlerHint,
} from "@kehto/services";

import { getNappletAddressCatalogId, getNappletCatalogId } from "../../helpers/nostr/napplets";
import { getDefaultIntentHandler, getInstalledNapplets, type InstalledNapplet } from "../installed-napplets";
import { acceptIntent } from "../napplet-intent-targets";

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
}) {
  const resolver = createCatalogIntentResolver({
    loadCatalog: () => getInstalledNapplets().flatMap(toCatalogEntry),
    targets: { accept: acceptIntent },
    getDefaultHandler: (archetype) => {
      const handler = getDefaultIntentHandler(archetype);
      return handler && getNappletAddressCatalogId(handler.address);
    },
    chooseHandler: (archetype, candidates) => options.chooseHandler(archetype, candidates),
    // A napplet may only address a specific handler the user picked as default or confirms now
    authorizeExplicitHandler: async (_sender, handler, request, candidate) =>
      candidate.isDefault || (await options.chooseHandler(request.archetype, [candidate])) === handler,
    resolveHandlerHint: (hint, candidates) => {
      const id = hintCatalogId(hint);
      return candidates.find((candidate) => candidate.id === id)?.id;
    },
  });

  return {
    resolver,
    service: createIntentService({ resolver, resolveSender: options.resolveSender }),
  };
}
