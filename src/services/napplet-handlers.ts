import { manifestToIntentCatalogEntry } from "@kehto/services";
import type { NostrEvent } from "nostr-tools";

import { handlerReference, preferredHandlerReferences } from "../helpers/nostr/handler-preferences";
import {
  getNappletAddress,
  getNappletArchetypes,
  getNappletCatalogId,
  getNappletTitle,
  getUnsupportedNappletRequirements,
  validateNappletManifest,
  getNappletIdentity,
} from "../helpers/nostr/napplets";
import { handlerManifests$, handlerPreferences$, localHandlerPreferences$ } from "./handler-preference-state";
import { getNappletPermissions } from "./napplet-shell/permission-types";
import { getPermissionDecision } from "./napplet-shell/permissions";

export function isNappletHandlerAllowed(event: NostrEvent) {
  return (
    validateNappletManifest(event) &&
    getUnsupportedNappletRequirements(event).length === 0 &&
    getNappletPermissions(event).every(
      (permission) => getPermissionDecision(getNappletIdentity(event), permission) !== "block",
    )
  );
}

export function supportsNappletIntent(event: NostrEvent, archetype: string, convention: string) {
  return getNappletArchetypes(event).some(
    (role) => role.name === archetype && role.contracts.some((contract) => contract.convention === convention),
  );
}

export function nappletCatalogEntry(event: NostrEvent) {
  return manifestToIntentCatalogEntry({
    catalogId: getNappletCatalogId(event),
    title: getNappletTitle(event),
    archetypes: getNappletArchetypes(event).flatMap((role) =>
      role.contracts.map((contract) => ({ slug: role.name, ...contract })),
    ),
  });
}

export function rememberHandlerManifest(event: NostrEvent) {
  const address = getNappletAddress(event);
  const reference = address && handlerReference(address);
  if (!reference || !validateNappletManifest(event)) throw new Error("Invalid napplet manifest");
  handlerManifests$.next(new Map(handlerManifests$.value).set(reference, event));
}

export function preferredNappletHandlers(archetype: string, convention: string, allowed = isNappletHandlerAllowed) {
  const manifests = handlerManifests$.value;
  const usable = (reference: string) => {
    const event = manifests.get(reference);
    return !!event && allowed(event) && supportsNappletIntent(event, archetype, convention);
  };
  const preference = handlerPreferences$.value.get(archetype);
  if (preference)
    return preferredHandlerReferences(preference, convention, usable).map((reference) => manifests.get(reference)!);
  const local = localHandlerPreferences$.value;
  const reference = local[convention] ?? local[archetype];
  return reference && usable(reference) ? [manifests.get(reference)!] : [];
}
