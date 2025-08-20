import {
  createAddressLoader,
  createEventLoader,
  createReactionsLoader,
  createSocialGraphLoader,
  createTagValueLoader,
  createUserListsLoader,
  createZapsLoader,
} from "applesauce-loaders/loaders";
import { kinds } from "nostr-tools";
import { cacheRequest } from "./event-cache";
import { eventStore } from "./event-store";
import localSettings from "./preferences";
import pool from "./pool";

/** Loader for replaceable events based on coordinate */
export const addressLoader = createAddressLoader(pool, {
  cacheRequest,
  eventStore,
  bufferTime: 500,
  extraRelays: localSettings.readRelays,
});

/** Loader for replaceable events based on coordinate */
export const profileLoader = createAddressLoader(pool, {
  cacheRequest,
  eventStore,
  bufferTime: 200,
  extraRelays: localSettings.readRelays,
  lookupRelays: localSettings.lookupRelays,
});

/** Loader for single events based on id */
export const eventLoader = createEventLoader(pool, {
  cacheRequest,
  eventStore,
  bufferTime: 500,
  extraRelays: localSettings.readRelays,
});

// Setup loaders on event store
eventStore.addressableLoader = addressLoader;
eventStore.replaceableLoader = addressLoader;
eventStore.eventLoader = eventLoader;

export const zapsLoader = createZapsLoader(pool, { cacheRequest, eventStore, extraRelays: localSettings.readRelays });

export const reactionsLoader = createReactionsLoader(pool, {
  cacheRequest,
  eventStore,
  extraRelays: localSettings.readRelays,
});

export const userSetsLoader = createUserListsLoader(pool, {
  cacheRequest,
  eventStore,
  extraRelays: localSettings.readRelays,
});

export const channelMetadataLoader = createTagValueLoader(pool, "e", {
  kinds: [kinds.ChannelMetadata],
  cacheRequest,
  extraRelays: localSettings.readRelays,
});

// A loader to load the group info from the relays
export const groupInfoLoader = createTagValueLoader(pool, "d", {
  kinds: [39000],
});

/** Loader for loading a users social graph */
export const socialGraphLoader = createSocialGraphLoader(profileLoader, {
  eventStore,
  extraRelays: localSettings.readRelays,
  hints: false,
});

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.profileLoader = profileLoader;
  // @ts-expect-error
  window.addressLoader = addressLoader;
  // @ts-expect-error
  window.eventLoader = eventLoader;
  // @ts-expect-error
  window.zapsLoader = zapsLoader;
  // @ts-expect-error
  window.reactionsLoader = reactionsLoader;
}
