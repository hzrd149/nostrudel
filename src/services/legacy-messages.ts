import { createOutboxTimelineLoader, TimelineLoader } from "applesauce-loaders/loaders";
import { kinds } from "nostr-tools";
import { map } from "rxjs";

import { mergeTimelineLoaders } from "../helpers/load-timeline-window";
import { LegacyConversationRelaysModel, LegacyMessageInboxesModel, LegacyMessageOutboxesModel } from "../models/messages";
import { cacheRequest } from "./event-cache";
import { eventStore } from "./event-store";
import pool from "./pool";

const options = { eventStore, cache: cacheRequest, limit: 100 };

/** Creates a loader for every NIP-04 message a user sent or received, reading each direction from the relays that hold it */
export function createLegacyInboxLoader(pubkey: string): TimelineLoader {
  const user = [{ pubkey }];
  const received = createOutboxTimelineLoader(
    pool,
    eventStore
      .model(LegacyMessageInboxesModel, pubkey)
      .pipe(map((relays) => Object.fromEntries(relays.map((relay) => [relay, user])))),
    { kinds: [kinds.EncryptedDirectMessage], "#p": [pubkey] },
    options,
  );
  const sent = createOutboxTimelineLoader(
    pool,
    eventStore
      .model(LegacyMessageOutboxesModel, pubkey)
      .pipe(map((relays) => Object.fromEntries(relays.map((relay) => [relay, user])))),
    { kinds: [kinds.EncryptedDirectMessage], authors: [pubkey] },
    options,
  );

  return mergeTimelineLoaders([received, sent]);
}

/** Creates a loader for one NIP-04 conversation, reading each side's messages from the relays that hold them */
export function createLegacyConversationLoader(self: string, other: string): TimelineLoader {
  // Each relay lists who the messages it holds are addressed to, the filter turns that into one filter per recipient
  return createOutboxTimelineLoader(
    pool,
    eventStore.model(LegacyConversationRelaysModel, self, other),
    (users) =>
      users.map((user) => ({
        kinds: [kinds.EncryptedDirectMessage],
        authors: [user.pubkey === self ? other : self],
        "#p": [user.pubkey],
      })),
    options,
  );
}

