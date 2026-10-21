import {
  createAddressLoader,
  createEventLoader,
  createReactionsLoader,
  createSocialGraphLoader,
  createTagValueLoader,
  createSyncLoader,
  createZapsLoader,
  createEventLoaderForStore,
  LoadableAddressPointer,
} from "applesauce-loaders/loaders";
import { kinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { concat, defer } from "rxjs";
import { getOutboxes, mergeRelaySets } from "applesauce-core/helpers";
import { mapEventsToStore } from "applesauce-core";
import { SET_KINDS } from "../helpers/nostr/lists";
import { cacheRequest } from "./event-cache";
import { eventStore } from "./event-store";
import { lookupRelays$ } from "./lookup-relays";
import localSettings from "./preferences";
import pool from "./pool";
import { BLOSSOM_SERVER_LIST_KIND, POLL_RESPONSE_KIND } from "applesauce-common/helpers";

/** Loader for replaceable events based on coordinate */
export const replaceableLoader = createAddressLoader(pool, {
  cacheRequest,
  eventStore,
  bufferTime: 500,
  extraRelays: localSettings.fallbackRelays,
});

/** Loader for replaceable events based on coordinate */
export const profileLoader = createAddressLoader(pool, {
  cacheRequest,
  eventStore,
  bufferTime: 200,
  extraRelays: localSettings.fallbackRelays,
  lookupRelays: lookupRelays$,
});

/** Address loader that switches based on kind */
export const addressLoader = (pointer: LoadableAddressPointer) => {
  if (
    pointer.kind === kinds.Metadata ||
    pointer.kind === kinds.RelayList ||
    pointer.kind === kinds.Metadata ||
    pointer.kind === BLOSSOM_SERVER_LIST_KIND
  )
    return profileLoader(pointer);
  else return replaceableLoader(pointer);
};

/** Loader for single events based on id */
export const eventLoader = createEventLoader(pool, {
  cacheRequest,
  eventStore,
  bufferTime: 500,
  extraRelays: localSettings.fallbackRelays,
});

// Setup loaders on event store
// v5: Use unified event loader that handles all pointer types
eventStore.eventLoader = createEventLoaderForStore(eventStore, pool, {
  cacheRequest,
  bufferTime: 500,
  extraRelays: localSettings.fallbackRelays,
});

export const zapsLoader = createZapsLoader(pool, {
  cacheRequest,
  eventStore,
  extraRelays: localSettings.fallbackRelays,
});

export const reactionsLoader = createReactionsLoader(pool, {
  cacheRequest,
  eventStore,
  extraRelays: localSettings.fallbackRelays,
});

export const pollResponseLoader = createTagValueLoader(pool, "e", {
  kinds: [POLL_RESPONSE_KIND],
  cacheRequest,
  eventStore,
  extraRelays: localSettings.fallbackRelays,
});

const syncUserSets = createSyncLoader({ pool, eventStore });

export function userSetsLoader(user: ProfilePointer) {
  const filter = { authors: [user.pubkey], kinds: SET_KINDS };
  return concat(
    cacheRequest([filter]).pipe(mapEventsToStore(eventStore)),
    defer(() => {
      const mailboxes = eventStore.getReplaceable(kinds.RelayList, user.pubkey);
      const relays = mergeRelaySets(
        mailboxes && getOutboxes(mailboxes),
        user.relays,
        localSettings.fallbackRelays.value,
      );
      return syncUserSets({ relays, filter }).events$;
    }),
  );
}

export const channelMetadataLoader = createTagValueLoader(pool, "e", {
  kinds: [kinds.ChannelMetadata],
  cacheRequest,
  extraRelays: localSettings.fallbackRelays,
});

// A loader to load the group info from the relays
export const groupInfoLoader = createTagValueLoader(pool, "d", {
  kinds: [39000],
});

/** Loader for loading a users social graph */
export const socialGraphLoader = createSocialGraphLoader(pool, {
  eventStore,
  extraRelays: lookupRelays$,
  hints: false,
});

if (import.meta.env.DEV) {
  Reflect.set(window, "profileLoader", profileLoader);
  Reflect.set(window, "addressLoader", replaceableLoader);
  Reflect.set(window, "eventLoader", eventLoader);
  Reflect.set(window, "zapsLoader", zapsLoader);
  Reflect.set(window, "reactionsLoader", reactionsLoader);
}
